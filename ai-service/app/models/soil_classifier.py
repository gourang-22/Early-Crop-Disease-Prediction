import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os
import json
import numpy as np

MODEL_PATH   = os.path.join(os.path.dirname(__file__), '../../ml_models/soil_classifier.pt')
CLASSES_PATH = os.path.join(os.path.dirname(__file__), '../../ml_models/soil_classes.json')

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

class SoilClassifier:
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
            # Fallback
            self.classes = ['Alluvial_Soil', 'Arid_Soil', 'Black_Soil',
                           'Laterite_Soil', 'Mountain_Soil', 'Red_Soil', 'Yellow_Soil']
        self.last_scores = [0.0] * len(self.classes)
        print(f"[SoilClassifier] Classes: {self.classes}")

    def _load_model(self):
        if not os.path.exists(MODEL_PATH):
            print("[SoilClassifier] No model found — running in MOCK mode")
            self.mock = True
            return

        self.mock = False
        self.model = models.efficientnet_b0(weights=None)

        # Match the custom head we trained with
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
        print(f"[SoilClassifier] ✅ Real model loaded! {len(self.classes)} classes")

    def predict(self, image: Image.Image):
        if self.mock:
            return self._mock_predict()

        tensor = TRANSFORM(image).unsqueeze(0)
        with torch.no_grad():
            logits = self.model(tensor)
            probs  = torch.softmax(logits, dim=1).squeeze().numpy()

        self.last_scores = probs.tolist()
        idx = int(np.argmax(probs))
        return self.classes[idx], float(probs[idx])

    def _mock_predict(self):
        import random
        scores = [random.random() for _ in self.classes]
        total  = sum(scores)
        scores = [s / total for s in scores]
        self.last_scores = scores
        idx = scores.index(max(scores))
        return self.classes[idx], scores[idx]