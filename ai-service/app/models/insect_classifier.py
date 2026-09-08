import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os
import json
import numpy as np

MODEL_PATH   = os.path.join(os.path.dirname(__file__), '../../ml_models/insect_classifier.pt')
CLASSES_PATH = os.path.join(os.path.dirname(__file__), '../../ml_models/insect_classes.json')

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

CLASS_INFO = {
    "Beneficial": {
        "type": "beneficial",
        "impact": "Improves soil health and crop yield naturally",
        "management": "Encourage their presence — they are good for your farm!"
    },
    "Harmful": {
        "type": "harmful",
        "impact": "Can damage crops and reduce yield significantly",
        "management": "Use organic pesticides or consult an agronomist for pest control."
    },
    "Neutral": {
        "type": "neutral",
        "impact": "Neither significantly beneficial nor harmful to crops",
        "management": "Monitor population levels and take action only if numbers increase significantly."
    }
}

class InsectClassifier:
    def __init__(self):
        self.last_scores = []
        self.mock = False
        self._load_classes()
        self._load_model()

    def _load_classes(self):
        if os.path.exists(CLASSES_PATH):
            with open(CLASSES_PATH, 'r') as f:
                data = json.load(f)
            self.classes = data['classes']
        else:
            self.classes = ['Beneficial', 'Harmful', 'Neutral']
        self.last_scores = [0.0] * len(self.classes)
        print(f"[InsectClassifier] Classes: {self.classes}")

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            print("[InsectClassifier] No model found — running in MOCK mode")
            self.mock = True
            return

        self.mock = False
        self.model = models.efficientnet_b0(weights=None)
        self.model.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(self.model.classifier[1].in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, len(self.classes)),
        )
        self.model.load_state_dict(
            torch.load(MODEL_PATH, map_location='cpu')
        )
        self.model.eval()
        print(f"[InsectClassifier] ✅ Real model loaded! {len(self.classes)} classes")

    def predict(self, image: Image.Image):
        if self.mock:
            return self._mock_predict()

        tensor = TRANSFORM(image).unsqueeze(0)
        with torch.no_grad():
            logits = self.model(tensor)
            probs  = torch.softmax(logits, dim=1).squeeze().numpy()

        self.last_scores = probs.tolist()
        idx = int(np.argmax(probs))
        predicted_class = self.classes[idx]
        info = CLASS_INFO.get(predicted_class, CLASS_INFO['Neutral'])

        return {
            "insect_type": predicted_class,
            "confidence": float(probs[idx]),
            "type": info["type"],
            "impact": info["impact"],
            "management": info["management"],
            "all_scores": {
                cls: round(float(score), 4)
                for cls, score in zip(self.classes, self.last_scores)
            }
        }

    def _mock_predict(self):
        import random
        scores = [random.random() for _ in self.classes]
        total  = sum(scores)
        scores = [s / total for s in scores]
        self.last_scores = scores
        idx = scores.index(max(scores))
        predicted_class = self.classes[idx]
        info = CLASS_INFO.get(predicted_class, CLASS_INFO['Neutral'])
        return {
            "insect_type": predicted_class,
            "confidence": scores[idx],
            "type": info["type"],
            "impact": info["impact"],
            "management": info["management"],
            "all_scores": {
                cls: round(float(score), 4)
                for cls, score in zip(self.classes, self.last_scores)
            }
        }