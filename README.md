# Moral Foundation Annotation Tool

## First Time to Run
NodeJS is required.

1. Clean the `data` directory.
2. Extract all data files to the `data` directory (`gunzip` them if they are .gz files).
3. Set `random_sample` to `true` at the first line of the file `routes/index.js`.
4. Run `DEBUG=mofa:* npm start` to generate the random data set, and exit the program when you see 'Random sampling finished.'
5. Set `randon_sample` back to `false`.
6. Set `update_stats` to `true` at the second line of the file `routes/index.js`.
7. Run `DEBUG=mofa:* npm start` to update data stats, and exit the program when you see the **Second** 'Data set stats updated.'
8. Set `update_stats` back to `false`.
9. Run `DEBUG=mofa:* npm start`.
10. Visit \<IP_ADDRESS/DOMAIN_NAME\>:3000 (server) or 127.0.0.1:3000 (local).
