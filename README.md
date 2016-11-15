# Moral Foundation Annotation Tool

## First Time to Run
NodeJS is required.

1. Clean the `data` directory.
2. Extract all data files to the `data` directory (`gunzip` them if they are .gz files).
3. Set `update_stats` to `true` at the first line of the file `routes/index.js`.
4. `cd` to the `Mofa` directory, and run the annotation tool using `DEBUG=mofa:* npm start`
5. Set `update_stats` back to `false`
6. Visit \<IP_ADDRESS/DOMAIN_NAME\>:3000 (server) or 127.0.0.1:3000 (local)

# Files and Directories
- `/issue_list.txt`: issue list file. Pre-defined issues can be added to this file. New issues tagged by annotators will be appended to this file automatically.
- `/data/`: data file directory.
- `/annotation/`: annotation file directory.

# Random Sample

1. Set `random_sample` to `true` at the second line of the file `routes/index.js`.
2. Run `DEBUG=mofa:* npm start`.
3. The program will exit after the random sampling finishes.
4. Set `randon_sample` back to `false`.
