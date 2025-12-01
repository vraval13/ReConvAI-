from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer
import torch
import os

# ✅ Use full repo id
model_name = "sentence-transformers/all-MiniLM-L6-v2"

# Load model
model = SentenceTransformer(model_name)
hf_model = model._first_module().auto_model  # The actual transformer model
tokenizer = AutoTokenizer.from_pretrained(model_name)

hf_model.eval()

dummy_text = ["This is a dummy sentence for ONNX export."]
inputs = tokenizer(dummy_text, padding=True, truncation=True, return_tensors="pt")

input_ids = inputs["input_ids"]
attention_mask = inputs["attention_mask"]

os.makedirs("./onnx_model", exist_ok=True)

# Export only the transformer part (without pooling or SentenceTransformer glue)
torch.onnx.export(
    hf_model,
    (input_ids, attention_mask),
    "./onnx_model/model.onnx",
    input_names=["input_ids", "attention_mask"],
    output_names=["last_hidden_state"],
    dynamic_axes={
        "input_ids": {0: "batch_size", 1: "seq_len"},
        "attention_mask": {0: "batch_size", 1: "seq_len"},
        "last_hidden_state": {0: "batch_size", 1: "seq_len"}
    },
    opset_version=11,
)
print("ONNX model exported to ./onnx_model/model.onnx")
