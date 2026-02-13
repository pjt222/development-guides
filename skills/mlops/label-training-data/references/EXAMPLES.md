# Label Training Data — Extended Examples

Complete configuration files and code templates.


## Step 1: Install and Configure Label Studio

### Code Block 1

```bash

# docker-compose.yml
version: '3.8'

services:
  label-studio:
    image: heartexlabs/label-studio:latest
    ports:
      - "8080:8080"
    volumes:
      - ./data:/label-studio/data
      - ./config:/label-studio/config
    environment:
      - LABEL_STUDIO_HOST=http://localhost:8080
      - DJANGO_DB=default
      - POSTGRE_NAME=labelstudio
      - POSTGRE_USER=labelstudio
      - POSTGRE_PASSWORD=your_password
      - POSTGRE_HOST=postgres
      - POSTGRE_PORT=5432
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=labelstudio
      - POSTGRES_USER=labelstudio
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

```


## Step 2: Design Labeling Interface and Schema

### Code Block 2

```python

# labeling-project/config/labeling_config.py
"""
Label Studio configuration templates for common tasks.
"""

# Text Classification (single label)
TEXT_CLASSIFICATION = """
<View>
  <Header value="Classify the sentiment of this text"/>

  <Text name="text" value="$text"/>

  <Choices name="sentiment" toName="text" choice="single" showInLine="true">
    <Choice value="Positive"/>
    <Choice value="Negative"/>
    <Choice value="Neutral"/>
  </Choices>
</View>
"""

# Text Classification (multi-label)
TEXT_MULTILABEL = """
<View>
  <Header value="Select all applicable categories"/>

  <Text name="text" value="$text"/>

  <Choices name="categories" toName="text" choice="multiple">
    <Choice value="Technical"/>
    <Choice value="Billing"/>
    <Choice value="Feature Request"/>
    <Choice value="Bug Report"/>
    <Choice value="Other"/>
  </Choices>
</View>
"""

# Named Entity Recognition (NER)
NER_CONFIG = """
<View>
  <Header value="Highlight named entities in the text"/>

  <Text name="text" value="$text"/>

  <Labels name="label" toName="text">
    <Label value="Person" background="red"/>
    <Label value="Organization" background="darkorange"/>
    <Label value="Location" background="blue"/>
    <Label value="Date" background="green"/>
    <Label value="Money" background="purple"/>
  </Labels>
</View>
"""

# Image Classification
IMAGE_CLASSIFICATION = """
<View>
  <Header value="Classify this image"/>

  <Image name="image" value="$image" zoom="true" zoomControl="true"/>

  <Choices name="class" toName="image" choice="single">
    <Choice value="Cat"/>
    <Choice value="Dog"/>
    <Choice value="Bird"/>
    <Choice value="Other Animal"/>
  </Choices>

  <Header value="Quality Check"/>
  <Choices name="quality" toName="image" choice="single" showInLine="true">
    <Choice value="Clear"/>
    <Choice value="Blurry"/>
    <Choice value="Dark"/>
    <Choice value="Obstructed"/>
  </Choices>
</View>
"""

# Image Segmentation / Bounding Box
IMAGE_DETECTION = """
<View>
  <Header value="Draw bounding boxes around objects"/>

  <Image name="image" value="$image" zoom="true" zoomControl="true"/>

  <RectangleLabels name="bbox" toName="image">
    <Label value="Person" background="red"/>
    <Label value="Car" background="blue"/>
    <Label value="Bicycle" background="green"/>
    <Label value="Traffic Light" background="yellow"/>
  </RectangleLabels>

  <PolygonLabels name="segmentation" toName="image">
    <Label value="Road" background="gray"/>
    <Label value="Sidewalk" background="orange"/>
  </PolygonLabels>
</View>
"""

# Audio Classification
AUDIO_CLASSIFICATION = """
<View>
  <Header value="Classify the audio content"/>

  <Audio name="audio" value="$audio"/>

  <Choices name="content" toName="audio" choice="single">
    <Choice value="Speech"/>
    <Choice value="Music"/>
    <Choice value="Noise"/>
    <Choice value="Silence"/>
  </Choices>

  <Choices name="quality" toName="audio" choice="single" showInLine="true">
    <Choice value="Clear"/>
    <Choice value="Noisy"/>
    <Choice value="Distorted"/>
  </Choices>
</View>
"""

# Pairwise Comparison (for ranking/preference)
PAIRWISE_COMPARISON = """
<View>
  <Header value="Which response is better?"/>

  <Text name="prompt" value="$prompt"/>

  <View style="display: flex; flex-direction: row;">
    <View style="flex: 1; padding: 10px; border: 1px solid #ccc; margin: 5px;">
      <Header value="Response A"/>
      <Text name="response_a" value="$response_a"/>
    </View>
    <View style="flex: 1; padding: 10px; border: 1px solid #ccc; margin: 5px;">
      <Header value="Response B"/>
      <Text name="response_b" value="$response_b"/>
    </View>
  </View>

  <Choices name="preference" toName="prompt" choice="single" showInLine="true">
    <Choice value="A is much better"/>
    <Choice value="A is slightly better"/>
    <Choice value="About the same"/>
    <Choice value="B is slightly better"/>
    <Choice value="B is much better"/>
  </Choices>

  <TextArea name="reasoning" toName="prompt" placeholder="Explain your choice (optional)"/>
</View>
"""


def create_labeling_project(
    project_name: str,
    config_xml: str,
    data_file: str,
    label_studio_url: str = "http://localhost:8080",
    api_key: str = None,
):
    """
    Programmatically create Label Studio project via API.
    """
    import requests
    import json

    headers = {}
    if api_key:
        headers["Authorization"] = f"Token {api_key}"

    # Create project
    project_data = {
        "title": project_name,
        "label_config": config_xml,
    }

    response = requests.post(
        f"{label_studio_url}/api/projects/",
        json=project_data,
        headers=headers,
    )

    if response.status_code != 201:
        raise Exception(f"Failed to create project: {response.text}")

    project_id = response.json()["id"]
    print(f"Created project {project_id}: {project_name}")

    # Import data
    import_data = {
        "file": open(data_file, "rb"),
    }

    response = requests.post(
        f"{label_studio_url}/api/projects/{project_id}/import",
        files=import_data,
        headers=headers,
    )

    if response.status_code == 201:
        print(f"Imported data from {data_file}")
    else:
        print(f"Import warning: {response.text}")

    return project_id


# Example usage
if __name__ == "__main__":
    # Create sentiment classification project
    project_id = create_labeling_project(
        project_name="Customer Feedback Sentiment",
        config_xml=TEXT_CLASSIFICATION,
        data_file="data/customer_feedback.json",
        api_key="your_api_key_here",
    )

```


## Step 3: Prepare Data and Implement Sampling Strategy

### Code Block 3

```python

# labeling-project/prepare_data.py
import pandas as pd
import json
import random
from typing import List, Dict
from sklearn.cluster import KMeans
import numpy as np


class DataSampler:
    """
    Sample data for efficient labeling using various strategies.
    """
    def __init__(self, data: pd.DataFrame):
        self.data = data

    def random_sample(self, n: int, seed: int = 42) -> pd.DataFrame:
        """
        Simple random sampling.
        """
        return self.data.sample(n=n, random_state=seed)

    def stratified_sample(self, n: int, strata_column: str, seed: int = 42) -> pd.DataFrame:
        """
        Stratified sampling to ensure representation of all groups.
        """
        # Calculate samples per stratum proportional to size
        strata_sizes = self.data[strata_column].value_counts()
        samples_per_stratum = (strata_sizes / len(self.data) * n).astype(int)

        sampled = []
        for stratum, sample_size in samples_per_stratum.items():
            stratum_data = self.data[self.data[strata_column] == stratum]
            sampled.append(stratum_data.sample(n=min(sample_size, len(stratum_data)), random_state=seed))

        return pd.concat(sampled)

    def uncertainty_sample(
        self,
        n: int,
        predictions: np.ndarray,
        method: str = "least_confident",
    ) -> pd.DataFrame:
        """
        Sample examples where model is least confident (active learning).

        Args:
            n: Number of samples
            predictions: Model prediction probabilities (shape: [n_samples, n_classes])
            method: "least_confident", "margin", or "entropy"
        """
        if method == "least_confident":
            # Sample with lowest max probability
            uncertainty = 1 - predictions.max(axis=1)
        elif method == "margin":
            # Sample with smallest margin between top 2 classes
            sorted_preds = np.sort(predictions, axis=1)
            uncertainty = sorted_preds[:, -1] - sorted_preds[:, -2]
        elif method == "entropy":
            # Sample with highest entropy
            uncertainty = -np.sum(predictions * np.log(predictions + 1e-10), axis=1)
        else:
            raise ValueError(f"Unknown method: {method}")

        # Get top N most uncertain
        uncertain_indices = np.argsort(uncertainty)[-n:]

        return self.data.iloc[uncertain_indices]

    def diversity_sample(
        self,
        n: int,
        features: np.ndarray,
        n_clusters: int = None,
    ) -> pd.DataFrame:
        """
        Sample diverse examples using clustering.
        """
        if n_clusters is None:
            n_clusters = min(n, len(self.data) // 10)

        # Cluster data
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(features)

        # Sample from each cluster
        samples_per_cluster = n // n_clusters

        sampled_indices = []
        for cluster_id in range(n_clusters):
            cluster_indices = np.where(clusters == cluster_id)[0]
            if len(cluster_indices) > 0:
                # Sample closest to centroid (most representative)
                distances = np.linalg.norm(
                    features[cluster_indices] - kmeans.cluster_centers_[cluster_id],
                    axis=1,
                )
                closest_indices = cluster_indices[np.argsort(distances)[:samples_per_cluster]]
                sampled_indices.extend(closest_indices)

        return self.data.iloc[sampled_indices[:n]]


def prepare_label_studio_format(
    data: pd.DataFrame,
    task_type: str,
    text_column: str = None,
    image_column: str = None,
    output_file: str = "data/tasks.json",
) -> List[Dict]:
    """
    Convert DataFrame to Label Studio JSON format.

    Args:
        data: DataFrame with data to label
        task_type: "text_classification", "ner", "image_classification", etc.
        text_column: Column containing text data
        image_column: Column containing image URLs or paths
        output_file: Output JSON file path

    Returns:
        List of task dictionaries
    """
    tasks = []

    for idx, row in data.iterrows():
        task = {"id": int(idx)}

        if task_type in ["text_classification", "ner"]:
            task["data"] = {"text": row[text_column]}

        elif task_type == "image_classification":
            task["data"] = {"image": row[image_column]}

        elif task_type == "pairwise_comparison":
            task["data"] = {
                "prompt": row["prompt"],
                "response_a": row["response_a"],
                "response_b": row["response_b"],
            }

        # Add metadata for tracking
        task["meta"] = {
            "source": row.get("source", "unknown"),
            "created_at": row.get("created_at", ""),
        }

        tasks.append(task)

    # Save to JSON
    with open(output_file, "w") as f:
        json.dump(tasks, f, indent=2)

    print(f"Saved {len(tasks)} tasks to {output_file}")

    return tasks


# Example usage
if __name__ == "__main__":
    # Load unlabeled data
    df = pd.read_csv("data/unlabeled_texts.csv")

    # Sample 1000 examples for labeling
    sampler = DataSampler(df)

    # Strategy 1: Random sampling
    sample = sampler.random_sample(n=1000)

    # Strategy 2: Uncertainty sampling (if predictions available)
    # predictions = model.predict_proba(df["text"])
    # sample = sampler.uncertainty_sample(n=1000, predictions=predictions)

    # Prepare for Label Studio
    tasks = prepare_label_studio_format(
        data=sample,
        task_type="text_classification",
        text_column="text",
        output_file="data/tasks_batch1.json",
    )

```


## Step 4: Implement Quality Control and IAA Measurement

### Code Block 4

```python

# labeling-project/quality_control.py
import pandas as pd
import numpy as np
from sklearn.metrics import cohen_kappa_score, confusion_matrix
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QualityController:
    """
    Measure inter-annotator agreement and identify quality issues.
    """
    def __init__(self, annotations: pd.DataFrame):
        """
        Args:
            annotations: DataFrame with columns [task_id, annotator_id, label]
        """
        self.annotations = annotations

    def calculate_agreement(
        self,
        annotator1: str,
        annotator2: str,
        metric: str = "cohen_kappa",
    ) -> float:
        """
        Calculate agreement between two annotators.

        Args:
            annotator1, annotator2: Annotator IDs
            metric: "cohen_kappa", "fleiss_kappa", or "simple_agreement"

        Returns:
            Agreement score (0-1)
        """
        # Get labels from both annotators for same tasks
        ann1_labels = self.annotations[self.annotations["annotator_id"] == annotator1]
        ann2_labels = self.annotations[self.annotations["annotator_id"] == annotator2]

        # Merge on task_id
        merged = ann1_labels.merge(
            ann2_labels,
            on="task_id",
            suffixes=("_1", "_2"),
        )

        if len(merged) == 0:
            logger.warning(f"No overlapping tasks between {annotator1} and {annotator2}")
            return None

        labels1 = merged["label_1"].values
        labels2 = merged["label_2"].values

        if metric == "cohen_kappa":
            return cohen_kappa_score(labels1, labels2)
        elif metric == "simple_agreement":
            return (labels1 == labels2).mean()
        else:
            raise ValueError(f"Unknown metric: {metric}")

    def calculate_pairwise_agreement(self) -> pd.DataFrame:
        """
        Calculate pairwise agreement between all annotators.

        Returns:
            DataFrame with annotator pairs and agreement scores
        """
        annotators = self.annotations["annotator_id"].unique()

        results = []
        for i, ann1 in enumerate(annotators):
            for ann2 in annotators[i + 1:]:
                kappa = self.calculate_agreement(ann1, ann2, metric="cohen_kappa")
                simple = self.calculate_agreement(ann1, ann2, metric="simple_agreement")

                results.append({
                    "annotator1": ann1,
                    "annotator2": ann2,
                    "cohen_kappa": kappa,
                    "simple_agreement": simple,
                })

        return pd.DataFrame(results)

    def identify_difficult_tasks(self, min_annotators: int = 2) -> pd.DataFrame:
        """
        Find tasks where annotators disagree (need adjudication).
        """
        # Group by task_id
        task_groups = self.annotations.groupby("task_id")

        difficult_tasks = []

        for task_id, group in task_groups:
            if len(group) < min_annotators:
                continue

            # Check for disagreement
            unique_labels = group["label"].nunique()

            if unique_labels > 1:
                # Calculate label distribution
                label_counts = group["label"].value_counts()

                difficult_tasks.append({
                    "task_id": task_id,
                    "n_annotators": len(group),
                    "n_unique_labels": unique_labels,
                    "labels": label_counts.to_dict(),
                    "agreement": label_counts.max() / len(group),
                })

        return pd.DataFrame(difficult_tasks).sort_values("agreement")

    def calculate_annotator_performance(
        self,
        gold_labels: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Evaluate annotator accuracy against gold standard labels.

        Args:
            gold_labels: DataFrame with columns [task_id, gold_label]

        Returns:
            DataFrame with annotator performance metrics
        """
        # Merge annotations with gold labels
        merged = self.annotations.merge(gold_labels, on="task_id")

        # Calculate metrics per annotator
        results = []

        for annotator in merged["annotator_id"].unique():
            ann_data = merged[merged["annotator_id"] == annotator]

            accuracy = (ann_data["label"] == ann_data["gold_label"]).mean()

            # Confusion matrix
            cm = confusion_matrix(
                ann_data["gold_label"],
                ann_data["label"],
            )

            results.append({
                "annotator_id": annotator,
                "n_tasks": len(ann_data),
                "accuracy": accuracy,
                "confusion_matrix": cm.tolist(),
            })

        return pd.DataFrame(results).sort_values("accuracy", ascending=False)

    def generate_quality_report(self) -> Dict:
        """
        Generate comprehensive quality report.
        """
        # Overall statistics
        n_tasks = self.annotations["task_id"].nunique()
        n_annotators = self.annotations["annotator_id"].nunique()
        total_annotations = len(self.annotations)
        avg_annotations_per_task = total_annotations / n_tasks

        # Pairwise agreement
        agreement_df = self.calculate_pairwise_agreement()
        avg_kappa = agreement_df["cohen_kappa"].mean()

        # Difficult tasks
        difficult = self.identify_difficult_tasks()

        report = {
            "summary": {
                "n_tasks": n_tasks,
                "n_annotators": n_annotators,
                "total_annotations": total_annotations,
                "avg_annotations_per_task": avg_annotations_per_task,
                "avg_cohen_kappa": avg_kappa,
            },
            "agreement_quality": self._interpret_kappa(avg_kappa),
            "n_difficult_tasks": len(difficult),
            "difficult_task_rate": len(difficult) / n_tasks,
        }

        return report

    def _interpret_kappa(self, kappa: float) -> str:
        """Interpret Cohen's Kappa value."""
        if kappa < 0:
            return "Poor (worse than random)"
        elif kappa < 0.20:
            return "Slight"
        elif kappa < 0.40:
            return "Fair"
        elif kappa < 0.60:
            return "Moderate"
        elif kappa < 0.80:
            return "Substantial"
        else:
            return "Almost Perfect"


# Example usage
if __name__ == "__main__":
    # Load annotations from Label Studio export
    annotations = pd.read_json("exports/annotations.json")

    # Flatten Label Studio format
    flattened = []
    for item in annotations:
        task_id = item["id"]
        for annotation in item["annotations"]:
            annotator = annotation["completed_by"]
            label = annotation["result"][0]["value"]["choices"][0]

            flattened.append({
                "task_id": task_id,
                "annotator_id": annotator,
                "label": label,
            })

    df = pd.DataFrame(flattened)

    # Quality control
    qc = QualityController(df)

    # Generate report
    report = qc.generate_quality_report()

    print("=== Quality Control Report ===")
    print(f"Total tasks: {report['summary']['n_tasks']}")
    print(f"Total annotators: {report['summary']['n_annotators']}")
    print(f"Average Cohen's Kappa: {report['summary']['avg_cohen_kappa']:.3f}")
    print(f"Agreement quality: {report['agreement_quality']}")
    print(f"Difficult tasks: {report['n_difficult_tasks']} ({report['difficult_task_rate']:.1%})")

    # Identify annotators needing training
    agreement_df = qc.calculate_pairwise_agreement()
    low_agreement = agreement_df[agreement_df["cohen_kappa"] < 0.6]

    if len(low_agreement) > 0:
        print("\n⚠️ Annotator pairs with low agreement:")
        print(low_agreement)

```


## Step 5: Export and Integrate Labeled Data

### Code Block 5

```python

# labeling-project/export_labels.py
import requests
import pandas as pd
import json
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class LabelStudioExporter:
    """
    Export labeled data from Label Studio.
    """
    def __init__(self, url: str = "http://localhost:8080", api_key: str = None):
        self.url = url.rstrip("/")
        self.api_key = api_key
        self.headers = {}
        if api_key:
            self.headers["Authorization"] = f"Token {api_key}"

    def export_project(
        self,
        project_id: int,
        export_format: str = "JSON",
        output_file: str = None,
    ) -> List[Dict]:
        """
        Export all annotations from a project.

        Args:
            project_id: Project ID
            export_format: "JSON", "CSV", "COCO", "YOLO", etc.
            output_file: Path to save export

        Returns:
            List of exported annotations
        """
        response = requests.get(
            f"{self.url}/api/projects/{project_id}/export",
            params={"exportType": export_format},
            headers=self.headers,
        )

        if response.status_code != 200:
            raise Exception(f"Export failed: {response.text}")

        data = response.json()

        if output_file:
            with open(output_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Exported {len(data)} annotations to {output_file}")

        return data

    def get_completed_tasks(self, project_id: int) -> pd.DataFrame:
        """
        Get tasks that have been fully annotated.
        """
        response = requests.get(
            f"{self.url}/api/projects/{project_id}/tasks",
            params={"page_size": 10000},
            headers=self.headers,
        )

        tasks = response.json()["tasks"]

        # Filter completed tasks
        completed = [t for t in tasks if t["is_labeled"]]

        logger.info(f"Found {len(completed)}/{len(tasks)} completed tasks")

        return pd.DataFrame(completed)


def convert_to_training_format(
    annotations: List[Dict],
    task_type: str,
) -> pd.DataFrame:
    """
    Convert Label Studio annotations to ML training format.

    Args:
        annotations: List of annotation dicts from Label Studio
        task_type: "text_classification", "ner", "image_detection", etc.

    Returns:
        DataFrame ready for ML training
    """
    training_data = []

    for item in annotations:
        task_id = item["id"]
        data = item["data"]

        # Skip if no annotations
        if not item.get("annotations"):
            continue

        # Use first annotation (or implement consensus logic)
        annotation = item["annotations"][0]

        if task_type == "text_classification":
            # Extract text and label
            text = data.get("text", "")
            label = annotation["result"][0]["value"]["choices"][0]

            training_data.append({
                "task_id": task_id,
                "text": text,
                "label": label,
            })

        elif task_type == "ner":
            # Extract text and entity spans
            text = data.get("text", "")
            entities = []

            for result in annotation["result"]:
                if result["type"] == "labels":
                    entities.append({
                        "start": result["value"]["start"],
                        "end": result["value"]["end"],
                        "text": result["value"]["text"],
                        "label": result["value"]["labels"][0],
                    })

            training_data.append({
                "task_id": task_id,
                "text": text,
                "entities": entities,
            })

        elif task_type == "image_classification":
            # Extract image path and label
            image = data.get("image", "")
            label = annotation["result"][0]["value"]["choices"][0]

            training_data.append({
                "task_id": task_id,
                "image_path": image,
                "label": label,
            })

    return pd.DataFrame(training_data)


# Example usage
if __name__ == "__main__":
    exporter = LabelStudioExporter(
        url="http://localhost:8080",
        api_key="your_api_key",
    )

    # Export project
    project_id = 1
    annotations = exporter.export_project(
        project_id=project_id,
        output_file="exports/project1_annotations.json",
    )

    # Convert to training format
    training_df = convert_to_training_format(
        annotations,
        task_type="text_classification",
    )

    # Save to CSV
    training_df.to_csv("data/training_data.csv", index=False)

    print(f"Prepared {len(training_df)} examples for training")
    print(f"Label distribution:\n{training_df['label'].value_counts()}")

```


## Step 6: Set Up Continuous Labeling Pipeline

### Code Block 6

```python

# labeling-project/active_learning_pipeline.py
import schedule
import time
import logging
from datetime import datetime
from prepare_data import DataSampler, prepare_label_studio_format
from export_labels import LabelStudioExporter, convert_to_training_format
import pandas as pd
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_active_learning_iteration():
    """
    Active learning iteration:
    1. Load current model
    2. Generate predictions on unlabeled data
    3. Sample most uncertain examples
    4. Import to Label Studio
    5. Wait for labeling
    6. Export and retrain
    """
    try:
        logger.info("Starting active learning iteration")

        # 1. Load model
        model = joblib.load("models/current_model.pkl")

        # 2. Load unlabeled data
        unlabeled = pd.read_csv("data/unlabeled_pool.csv")

        # 3. Generate predictions
        predictions = model.predict_proba(unlabeled["text"])

        # 4. Sample uncertain examples
        sampler = DataSampler(unlabeled)
        batch = sampler.uncertainty_sample(
            n=100,
            predictions=predictions,
            method="least_confident",
        )

        # 5. Prepare for Label Studio
        tasks = prepare_label_studio_format(
            data=batch,
            task_type="text_classification",
            text_column="text",
            output_file=f"data/batch_{datetime.now().strftime('%Y%m%d')}.json",
        )

        # 6. Import to Label Studio
        # (Manual step: import batch file via UI or API)

        logger.info(f"Prepared batch of {len(batch)} examples for labeling")

    except Exception as e:
        logger.error(f"Active learning iteration failed: {e}", exc_info=True)


def check_and_retrain():
    """
    Check for newly labeled data and retrain model if threshold reached.
    """
    try:
        exporter = LabelStudioExporter(api_key="your_api_key")

        # Export latest annotations
        annotations = exporter.export_project(project_id=1)
        training_df = convert_to_training_format(annotations, task_type="text_classification")

        # Check if enough new data for retraining
        previous_size = pd.read_csv("data/training_data.csv")
        new_examples = len(training_df) - len(previous_size)

        if new_examples >= 100:
            logger.info(f"Retraining with {new_examples} new examples")

            # Save updated training data
            training_df.to_csv("data/training_data.csv", index=False)

            # Trigger retraining (implement your ML pipeline)
            # retrain_model(training_df)

    except Exception as e:
        logger.error(f"Retrain check failed: {e}", exc_info=True)


if __name__ == "__main__":
    # Run active learning weekly
    schedule.every().monday.at("09:00").do(run_active_learning_iteration)

    # Check for retraining daily
    schedule.every().day.at("18:00").do(check_and_retrain)

    logger.info("Active learning pipeline started")

    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour

```
