# Moral Foundation Annotation Tool

## How to Run
First, `cd` to the project directory, and run Mofa using

```
DEBUG=mofa:* npm start 
```

After that visit 127.0.0.1:3000

## Note
- Data and annotation files are included for demostration purpose only. Please extract all JSON files from the Baltimore data set to the `data` directory and clean the `annotation` directory. After that, change the second line `var updateStats = false;
` in the `routes/index/js` file to `var updateStats = true;` and run the annotation tool once to update the data stats file.
