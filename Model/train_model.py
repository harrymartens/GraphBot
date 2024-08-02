# Added extra words to the tokenizer
# Token = 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
# Run cmd: huggingface-cli login
import json
import torch
from transformers import BertTokenizerFast, BertForTokenClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split 

snv = ["scatterplot", "scatter", "scatter chart", "scattergraph", "scatter plot", "scatterchart", "scatter graph"]

# Load dataset
def load_data(address):
    with open(address, 'r') as f:
        data = json.load(f)
    return data

# Tokenize the data and align the labels
def tokenize_and_align_labels(texts, labels, tokenizer):
    all_encodings = tokenizer(texts, truncation=True, padding=True, is_split_into_words=True, return_tensors="pt")
    all_aligned_labels = []

    for i, label in enumerate(labels):
        word_ids = all_encodings.word_ids(batch_index=i)
        aligned_label = []
        previous_word_idx = None
        for word_idx in word_ids:
            if word_idx is None:
                aligned_label.append(-100)
            elif word_idx != previous_word_idx:
                aligned_label.append(label[word_idx])
            else:
                aligned_label.append(-100)
            previous_word_idx = word_idx
        all_aligned_labels.append(aligned_label)

    labels_tensor = torch.tensor(all_aligned_labels, dtype=torch.long)
    return all_encodings, labels_tensor

class Dataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item['labels'] = self.labels[idx]
        return item

    def __len__(self):
        return len(self.labels)

def main():

    print("PyTorch version: ", torch.__version__)

    if torch.cuda.is_available():
        print(f"CUDA is available. PyTorch is using GPU: {torch.cuda.get_device_name(0)}")
        print(f"CUDA version: {torch.version.cuda}")
        print("cuDNN version: ", torch.backends.cudnn.version())
    else:
        print("CUDA is not available. PyTorch will use CPU.")

    # Check if CUDA is available and set the device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"Using device: {device}")

    # Load training set
    address = '../Training_Data/trainingData.json'
    main_set = load_data(address)

    # Load tokens and encodings
    tokens = [data_point['tokens'] for data_point in main_set]
    encodings = [data_point['NER_ENCODING'] for data_point in main_set]

    # Load tokenizer
    tokenizer = BertTokenizerFast.from_pretrained('bert-base-uncased')

    # Add custom tokens
    added_tokens = tokenizer.add_tokens(snv)
    print(f"Added {added_tokens} tokens")

    # Create training and eval sets from main training set
    training_set, eval_set, training_labels, eval_labels = train_test_split(tokens, encodings, test_size=0.2)
    
    # Create encodings and labels
    training_encodings, training_aligned_labels = tokenize_and_align_labels(training_set, training_labels, tokenizer)
    eval_encodings, eval_aligned_labels = tokenize_and_align_labels(eval_set, eval_labels, tokenizer)

    # Create Classes compatible with PyTorch datasets
    train_dataset = Dataset(training_encodings, training_aligned_labels)
    eval_dataset = Dataset(eval_encodings, eval_aligned_labels)  
    
    # Load the model
    model = BertForTokenClassification.from_pretrained('bert-base-uncased', num_labels=7)

    # Resize model's token embeddings to account for custom tokens
    model.resize_token_embeddings(len(tokenizer))
    print("Model resized")

    # Define training arguments
    training_args = TrainingArguments(
        output_dir='./results',             # Output directory
        num_train_epochs=3,              
        per_device_train_batch_size=100,    # Batch size per device during training
        warmup_steps=500,                   # Number of warmup steps for learning rate scheduler
        weight_decay=0.01,                  # Strength of weight decay
        logging_dir='./logs',               # Directory for storing logs
        eval_strategy="epoch",              # Evaluation strategy
        no_cuda=False
    )

    # Initialize the trainer
    trainer = Trainer(
        model=model,                        
        args=training_args,                  
        train_dataset=train_dataset,       
        eval_dataset=eval_dataset           
    )
    # Train the model
    trainer.train()

    model_name = 'model'
    model.save_pretrained(model_name)

    model.push_to_hub(f"GraphBot/{model_name}-pt")
    tokenizer.push_to_hub(f"GraphBot/{model_name}-pt")

    # Save model in TF format
    # tf_model = TFBertForTokenClassification.from_pretrained(model_name, from_pt=True)
    # tf_model.push_to_hub(f"GraphBot/{model_name}-pt")
    

if __name__ == '__main__':
    main()