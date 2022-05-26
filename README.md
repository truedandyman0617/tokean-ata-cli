## create ata 
### Install
```bash
yarn
```

### CLI
```bash
ts-node src/cli create-ata \
    -k ~/.config/solana/id.json \
    -r custom-rpc-url \
    -c csv-file-path \
    -s 1 \
    -t token-mint-address
```
-s OnlyShow ATA, It is not required option. If you want to check ATA only you should set this param to 1.
No need to use -k param if you want to use -s 1 param.
### CSV
[CSV template example](./blob/example.csv)
