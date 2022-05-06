import { program } from "commander";
import log, { LogLevelDesc } from "loglevel";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { loadWalletKey } from "./helpers/accounts";
import { parse } from 'csv-parse';
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvWriter } from 'csv-writer';

program.version("0.0.1");
log.setLevel("info");

// --------------------------------------------------------------------------------

programCommand("create-ata")
  .requiredOption('-c, --csv-path <string>', 'CSV file path')
  .requiredOption('-t, --token-mint <string>', 'Token mint address')
  .description("Create ATA")
  .action(async (directory, cmd) => {
    const {
      keypair,
      rpc,
      csvPath,
      tokenMint
    } = cmd.opts();

    const walletKeypairLoaded = loadWalletKey(keypair);
    const tokenMintAddress = new PublicKey(tokenMint);

    const csvFilePath = path.resolve(__dirname, csvPath);
    const headers = ['wallet', 'ata'];
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    type WalletList = {
      wallet: string;
      ata: string;
    };

    const opts = {
      preflightCommitment: "processed",
      confirmTransactionInitialTimeout: 120000,
      disableRetryOnRateLimit: false,
    };
    const connection = new Connection(rpc, opts);

    await parse(fileContent, {
      delimiter: ',',
      columns: headers,
    }, async (error, result: WalletList[]) => {
      if (error) {
        console.error(error);
      }
      let walletList = [];

      if (result.length > 0) {
        for (var i = 1; i < result.length; i++) {
          try {
            if (result[i].wallet && !result[i].ata) {
              let userWallet = new PublicKey(result[i].wallet)

              const userTokenAta = (await PublicKey.findProgramAddress(
                [
                  userWallet.toBuffer(),
                  TOKEN_PROGRAM_ID.toBuffer(),
                  tokenMintAddress.toBuffer(),
                ],
                ASSOCIATED_TOKEN_PROGRAM_ID
              ))[0];

              let _ata_info = await connection.getAccountInfo(userTokenAta);
              const signers = [];

              if (!_ata_info) {
                const tx = new Transaction();
                tx.add(Token.createAssociatedTokenAccountInstruction(
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                  TOKEN_PROGRAM_ID,
                  tokenMintAddress,
                  userTokenAta,
                  userWallet,
                  walletKeypairLoaded.publicKey
                ));

                signers.push(walletKeypairLoaded);

                let signature = await connection.sendTransaction(tx, signers);
                const sx = await connection.confirmTransaction(signature, 'finalized');
              }
              result[i].ata = userTokenAta.toBase58();
            }
            walletList.push(result[i]);
          } catch (error) {
            console.log("Failed: " + result[i].wallet);
          }
        }

        const csvWriter = createObjectCsvWriter({
          path: path.resolve(__dirname, csvPath),
          header: [
            { id: 'wallet', title: 'wallet' },
            { id: 'ata', title: 'ata' },
          ]
        });

        csvWriter
          .writeRecords(walletList)
          .then(() => console.log('Done successfully'));
      }
    });
  });

// --------------------------------------------------------------------------------

function programCommand(
  name: string,
  options: { requireWallet: boolean } = { requireWallet: true },
) {
  let cmProgram = program
    .command(name)
    .requiredOption(
      '-r, --rpc <string>',
      'rpc url'
    )
    .option('-l, --log-level <string>', 'log level', setLogLevel);

  if (options.requireWallet) {
    cmProgram = cmProgram.requiredOption(
      '-k, --keypair <path>',
      `Solana wallet location`,
    );
  }

  return cmProgram;
}


function setLogLevel(value: string) {
  if (value === undefined || value === null) {
    return;
  }
  log.info("setting the log value to: " + value);
  log.setLevel(value as LogLevelDesc);
}

program.parse(process.argv);
