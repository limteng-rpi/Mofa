# Moral Foundation Annotation Tool

## First Time to Run
- Clean the `data` directory.
- Extract all data files to the `data` directory (`gunzip` them if they are .gz files).
- Set `update_stats` to `true` in the first line of file `routes/index.js`.
- `cd` to the `Mofa` directory, and run the annotation tool using
```
DEBUG=mofa:* npm start 
```

- Set `update_stats  back to `false 
- Visit \<IP_ADDRESS/DOMAIN_NAME\>:3000 (server) or 127.0.0.1:3000 (local)
