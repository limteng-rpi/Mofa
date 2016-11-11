# Moral Foundation Annotation Tool

## How to Run
First, `cd` to the project directory, and run Mofa using

```
DEBUG=mofa:* npm start 
```

After that visit 127.0.0.1:3000

## Update Data Stats File
The data stats file `data_stats.json` contains meta data (name, path, size, doc number) for all data file. Example:
```
[
  {"name":"2015_04_12_04_00.json","path":"data/2015_04_12_04_00.json","size":1.5,"doc":5030},
  {"name":"2015_04_12_04_10.json","path":"data/2015_04_12_04_10.json","size":1.4,"doc":4720},
  {"name":"2015_04_12_04_20.json","path":"data/2015_04_12_04_20.json","size":1.3,"doc":4403},
  {"name":"2015_04_12_04_30.json","path":"data/2015_04_12_04_30.json","size":1.2,"doc":4258},
  {"name":"2015_04_12_04_40.json","path":"data/2015_04_12_04_40.json","size":1.2,"doc":4174},
  {"name":"2015_04_12_04_50.json","path":"data/2015_04_12_04_50.json","size":1.2,"doc":4060},
  {"name":"2015_04_12_05_00.json","path":"data/2015_04_12_05_00.json","size":1.2,"doc":3951}
]
```
Please update this file after changing the `data` directory by:
- In file `routes/index.js`, change the second line `var updateStats = false` to `var updateStats = true`.
- Run the annotation tool. The stats file will be updated automatically.
- Set `updateStats` back to `false`.

## Note
- Data and annotation files are included for demostration purpose only. Please extract all JSON files from the Baltimore data set to the `data` directory and clean the `annotation` directory. Remember to update the data stats file.
