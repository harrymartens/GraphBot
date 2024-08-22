# Bioinformatic Graph Generation Tool

<p float="left" align="middle">
    <img src="./Assets/GraphBot%20Home.png" width="500" style="margin-right: 20px;">
    <img src="./Assets/GraphBot%20Visualisation.png" width="500">
</p>

## Project Description

This project implements a machine learning model that generates bioinformatic graphs based on user-provided text queries. The model utilises Natural Language Processing (NLP) techniques to understand user intent and extract relevant information from the query. This information is then used to generate an appropriate bioinformatic graph using a visualisation library. This tool empowers researchers to explore complex biological data sets with ease by translating their scientific questions into interactive and informative visualisations.

The main purpose of this project was to experiment with smaller sized language models, and their ability to extract key terms. Being a smaller size, the model is also intended to be run locally from within the browser.
*Due to the state of TensorflowJS at the time of this project, we cannot run our model from within the browser, as the functions supporting our Model format have not been transferred to JS* 

### Machine Learning Model
We employed transfer learning with an existing BERT model to extract entities specifically relating to bioinformatics. More specifically, the model is trained to recognise X-axis variable name, Y-axis variable name and chart type for the purpose of creating Bioinformatics graphs. The training data also exposes the model to a large number of complex protein and gene names which it is able to recognise as graphing variables.
**A version of our model is available here: [GraphBot](https://huggingface.co/GraphBot)**

### Front-End UI

To interact with the model, we have created an Angular project featuring a simple yet modern chatbot design. It allows users to upload a CSV file and ask for a graph of two key variables to be produced and downloaded.

## How to Install and Run the Project

### Prerequisites

- Python 3.x
- pip
- torch
- transformers
- sklearn
- flask
- flask_cors

### ML Model
The files for training and running the model are stored within "GraphBot/Model".

To train the Model, run:
```bash
python3 train_model.py
```
The training data currently being used is located within 
**"GraphBot/Training_Data/trainingData.json"**

To run the model, we used Flask to start it on a local server. From within the model folder, run:
```bash
flask --app run_model run
```

Once the model has loaded, you can interact with it using:
```bash
python3 send_requests.py
```

**Some example queries are:**
- Chart MXD1 (Nose) against ZMPSTE24 (Spleen) in a scatter plot
- Create a bar chart of ACOX2 (Liver) vs KCNE4
- Depict a scatter comparing the log2 fold change in the expression of the groups PSMC3 (control) and HBM (untreated)


### Angular UI
To run the UI for the site, you must first run:
```bash
npm i
```
to install all required packages.

Then, you can run 
```bash
ng serve
```
to launch Angular locally.

Example CSV datasets are avaliable in **"GraphBot/sample_data"**

**Ensure that the model is running on flask before launching the frontend**

## Additional Notes
- This is a university project as part of DESN2000 in the Bioinformatics stream.
- The UI is a proof of concept for the Machine Learning Model, and does not currently handle all errors. 
