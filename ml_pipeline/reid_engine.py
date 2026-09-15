import cv2
import numpy as np
from typing import List
import torch
import torchvision.transforms as T
import torchvision.models as models

class VehicleReIDEngine:
    """
    Vehicle Re-Identification Engine (512-dimensional feature embedding).
    Extracts deep visual vectors to associate vehicles across non-overlapping cameras
    even when license plates are blurry or occluded.
    """
    def __init__(self, use_gpu: bool = True):
        self.device = torch.device("cuda:0" if use_gpu and torch.cuda.is_available() else "cpu")
        try:
            # Lightweight ResNet18 backbone modified for 512-dim embedding
            backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
            # Remove final classification layer to extract raw 512-dim feature embedding
            self.model = torch.nn.Sequential(*list(backbone.children())[:-1])
            self.model.to(self.device)
            self.model.eval()
            print(f"[ReID] Model initialized on {self.device}")
        except Exception as e:
            print(f"[ReID] Falling back to color-histogram embedding: {e}")
            self.model = None

        self.transform = T.Compose([
            T.ToPILImage(),
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def extract_embedding(self, vehicle_crop: np.ndarray) -> List[float]:
        """
        Extract L2-normalized 512-dimensional feature vector.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return [0.0] * 512

        if self.model is not None:
            try:
                # Convert BGR to RGB
                rgb = cv2.cvtColor(vehicle_crop, cv2.COLOR_BGR2RGB)
                tensor = self.transform(rgb).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    features = self.model(tensor)
                    features = features.view(features.size(0), -1).cpu().numpy()[0]
                    norm = np.linalg.norm(features)
                    if norm > 0:
                        features /= norm
                    return features.astype(float).tolist()
            except Exception as e:
                pass

        # Fallback: Spatial color histogram embedding
        hsv = cv2.cvtColor(cv2.resize(vehicle_crop, (64, 64)), cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        vec = hist.flatten()
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec.astype(float).tolist()
