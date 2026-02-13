# Setup AutoML Pipeline — Extended Examples

Complete configuration files and code templates.


## Step 2: Define Search Space and Objective (Optuna)

### Code Block 1

```python

# automl/optuna_config.py
import optuna
from optuna.pruners import HyperbandPruner
from optuna.samplers import TPESampler
import xgboost as xgb
from sklearn.metrics import roc_auc_score, mean_squared_error
import numpy as np


def define_xgboost_space(trial: optuna.Trial) -> dict:
    """
    Define search space for XGBoost hyperparameters.
    """
    return {
        # Tree structure
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "min_child_weight": trial.suggest_float("min_child_weight", 1, 10, log=True),

        # Boosting parameters
        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
        "n_estimators": trial.suggest_int("n_estimators", 50, 1000, step=50),

        # Regularization
        "gamma": trial.suggest_float("gamma", 1e-8, 1.0, log=True),
        "lambda": trial.suggest_float("lambda", 1e-8, 10.0, log=True),
        "alpha": trial.suggest_float("alpha", 1e-8, 10.0, log=True),

        # Sampling
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),

        # Other
        "random_state": 42,
        "objective": "binary:logistic",  # adjust for your task
        "eval_metric": "auc",
    }


def define_lightgbm_space(trial: optuna.Trial) -> dict:
    """
    Define search space for LightGBM hyperparameters.
    """
    return {
        "objective": "binary",
        "metric": "auc",
        "verbosity": -1,
        "boosting_type": trial.suggest_categorical("boosting_type", ["gbdt", "dart", "goss"]),

        # Tree structure
        "num_leaves": trial.suggest_int("num_leaves", 20, 200),
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "min_child_samples": trial.suggest_int("min_child_samples", 5, 100),

        # Learning
        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
        "n_estimators": trial.suggest_int("n_estimators", 50, 1000, step=50),

        # Regularization
        "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),

        # Sampling
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),

        "random_state": 42,
    }


def define_neural_net_space(trial: optuna.Trial) -> dict:
    """
    Define search space for neural network architecture.
    """
    n_layers = trial.suggest_int("n_layers", 1, 4)

    params = {
        "n_layers": n_layers,
        "learning_rate": trial.suggest_float("learning_rate", 1e-5, 1e-2, log=True),
        "batch_size": trial.suggest_categorical("batch_size", [32, 64, 128, 256]),
        "optimizer": trial.suggest_categorical("optimizer", ["adam", "sgd", "rmsprop"]),
        "dropout_rate": trial.suggest_float("dropout_rate", 0.1, 0.5),
    }

    # Layer-wise parameters
    for i in range(n_layers):
        params[f"n_units_layer_{i}"] = trial.suggest_int(
            f"n_units_layer_{i}", 32, 512, log=True
        )

    return params


class ObjectiveFunction:
    """
    Objective function for Optuna optimization.
    """
    def __init__(self, X_train, y_train, X_val, y_val, model_type="xgboost"):
        self.X_train = X_train
        self.y_train = y_train
        self.X_val = X_val
        self.y_val = y_val
        self.model_type = model_type

    def __call__(self, trial: optuna.Trial) -> float:
        """
        Train model with trial hyperparameters and return validation metric.
        """
        if self.model_type == "xgboost":
            return self._objective_xgboost(trial)
        elif self.model_type == "lightgbm":
            return self._objective_lightgbm(trial)
        elif self.model_type == "neural_net":
            return self._objective_neural_net(trial)
        else:
            raise ValueError(f"Unknown model_type: {self.model_type}")

    def _objective_xgboost(self, trial: optuna.Trial) -> float:
        """XGBoost objective with early stopping."""
        params = define_xgboost_space(trial)

        # Separate n_estimators for training
        n_estimators = params.pop("n_estimators")

        # Train with early stopping
        model = xgb.XGBClassifier(**params, n_estimators=n_estimators)

        model.fit(
            self.X_train,
            self.y_train,
            eval_set=[(self.X_val, self.y_val)],
            early_stopping_rounds=50,
            verbose=False,
        )

        # Predict and score
        y_pred = model.predict_proba(self.X_val)[:, 1]
        score = roc_auc_score(self.y_val, y_pred)

        # Report intermediate value for pruning
        trial.report(score, step=model.best_iteration)

        # Prune unpromising trials
        if trial.should_prune():
            raise optuna.TrialPruned()

        return score

    def _objective_lightgbm(self, trial: optuna.Trial) -> float:
        """LightGBM objective."""
        import lightgbm as lgb

        params = define_lightgbm_space(trial)
        n_estimators = params.pop("n_estimators")

        model = lgb.LGBMClassifier(**params, n_estimators=n_estimators)

        model.fit(
            self.X_train,
            self.y_train,
            eval_set=[(self.X_val, self.y_val)],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)],
        )

        y_pred = model.predict_proba(self.X_val)[:, 1]
        score = roc_auc_score(self.y_val, y_pred)

        return score

    def _objective_neural_net(self, trial: optuna.Trial) -> float:
        """Neural network objective (PyTorch example)."""
        import torch
        import torch.nn as nn
        from torch.utils.data import TensorDataset, DataLoader

        params = define_neural_net_space(trial)

        # Build model
        layers = []
        in_features = self.X_train.shape[1]

        for i in range(params["n_layers"]):
            out_features = params[f"n_units_layer_{i}"]
            layers.append(nn.Linear(in_features, out_features))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(params["dropout_rate"]))
            in_features = out_features

        layers.append(nn.Linear(in_features, 1))
        layers.append(nn.Sigmoid())

        model = nn.Sequential(*layers)

        # Training setup
        criterion = nn.BCELoss()
        if params["optimizer"] == "adam":
            optimizer = torch.optim.Adam(model.parameters(), lr=params["learning_rate"])
        elif params["optimizer"] == "sgd":
            optimizer = torch.optim.SGD(model.parameters(), lr=params["learning_rate"])
        else:
            optimizer = torch.optim.RMSprop(model.parameters(), lr=params["learning_rate"])

        # Data loaders
        train_dataset = TensorDataset(
            torch.FloatTensor(self.X_train.values),
            torch.FloatTensor(self.y_train.values),
        )
        train_loader = DataLoader(train_dataset, batch_size=params["batch_size"], shuffle=True)

        # Train for fixed epochs with pruning
        for epoch in range(50):
            model.train()
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                outputs = model(batch_x).squeeze()
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

            # Evaluate on validation
            model.eval()
            with torch.no_grad():
                val_preds = model(torch.FloatTensor(self.X_val.values)).squeeze().numpy()
                score = roc_auc_score(self.y_val, val_preds)

            # Report and prune
            trial.report(score, epoch)
            if trial.should_prune():
                raise optuna.TrialPruned()

        return score


# Example usage
if __name__ == "__main__":
    from sklearn.model_selection import train_test_split
    from sklearn.datasets import make_classification

    # Create sample data
    X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create study
    study = optuna.create_study(
        study_name="xgboost_tuning",
        direction="maximize",
        sampler=TPESampler(seed=42),
        pruner=HyperbandPruner(),
    )

    # Optimize
    objective = ObjectiveFunction(X_train, y_train, X_val, y_val, model_type="xgboost")

    study.optimize(objective, n_trials=100, timeout=3600)  # 100 trials or 1 hour

    print(f"Best trial: {study.best_trial.number}")
    print(f"Best score: {study.best_value:.4f}")
    print(f"Best params: {study.best_params}")

```


## Step 3: Run Optimization with Advanced Samplers

### Code Block 2

```python

# automl/run_optimization.py
import optuna
from optuna.samplers import TPESampler, CmaEsSampler, NSGAIISampler
from optuna.pruners import HyperbandPruner, MedianPruner, SuccessiveHalvingPruner
import joblib
import pandas as pd
from pathlib import Path


def run_optuna_study(
    objective_fn,
    study_name: str,
    n_trials: int = 100,
    timeout: int = 3600,
    n_jobs: int = 1,
    sampler_type: str = "tpe",
    pruner_type: str = "hyperband",
):
    """
    Run Optuna optimization study with configurable sampler and pruner.

    Args:
        objective_fn: Callable objective function
        study_name: Name for the study
        n_trials: Number of trials to run
        timeout: Maximum time in seconds
        n_jobs: Number of parallel jobs (-1 for all cores)
        sampler_type: "tpe", "cmaes", or "random"
        pruner_type: "hyperband", "median", "asha", or "none"
    """
    # Choose sampler
    if sampler_type == "tpe":
        sampler = TPESampler(seed=42, multivariate=True, group=True)
    elif sampler_type == "cmaes":
        sampler = CmaEsSampler(seed=42)
    elif sampler_type == "random":
        sampler = optuna.samplers.RandomSampler(seed=42)
    else:
        raise ValueError(f"Unknown sampler: {sampler_type}")

    # Choose pruner
    if pruner_type == "hyperband":
        pruner = HyperbandPruner(min_resource=1, max_resource=100, reduction_factor=3)
    elif pruner_type == "median":
        pruner = MedianPruner(n_startup_trials=5, n_warmup_steps=10)
    elif pruner_type == "asha":
        pruner = SuccessiveHalvingPruner()
    elif pruner_type == "none":
        pruner = optuna.pruners.NopPruner()
    else:
        raise ValueError(f"Unknown pruner: {pruner_type}")

    # Create study
    study = optuna.create_study(
        study_name=study_name,
        direction="maximize",
        sampler=sampler,
        pruner=pruner,
        load_if_exists=True,  # Resume if study exists
    )

    # Optimize
    study.optimize(
        objective_fn,
        n_trials=n_trials,
        timeout=timeout,
        n_jobs=n_jobs,
        show_progress_bar=True,
    )

    # Save results
    results_dir = Path("automl/results")
    results_dir.mkdir(exist_ok=True)

    # Save study
    joblib.dump(study, results_dir / f"{study_name}.pkl")

    # Export trials to DataFrame
    df = study.trials_dataframe()
    df.to_csv(results_dir / f"{study_name}_trials.csv", index=False)

    # Print summary
    print(f"\nOptimization completed!")
    print(f"Best trial: {study.best_trial.number}")
    print(f"Best value: {study.best_value:.4f}")
    print(f"Best params:")
    for key, value in study.best_params.items():
        print(f"  {key}: {value}")

    # Print pruning statistics
    pruned_trials = [t for t in study.trials if t.state == optuna.trial.TrialState.PRUNED]
    complete_trials = [t for t in study.trials if t.state == optuna.trial.TrialState.COMPLETE]

    print(f"\nStatistics:")
    print(f"  Completed trials: {len(complete_trials)}")
    print(f"  Pruned trials: {len(pruned_trials)}")
    print(f"  Pruning efficiency: {len(pruned_trials) / len(study.trials):.1%}")

    return study


def visualize_optimization(study: optuna.Study, study_name: str):
    """
    Generate visualization plots for optimization results.
    """
    from optuna.visualization import (
        plot_optimization_history,
        plot_param_importances,
        plot_parallel_coordinate,
        plot_slice,
    )

    results_dir = Path("automl/results")

    # Optimization history
    fig = plot_optimization_history(study)
    fig.write_html(results_dir / f"{study_name}_history.html")

    # Parameter importances
    fig = plot_param_importances(study)
    fig.write_html(results_dir / f"{study_name}_importance.html")

    # Parallel coordinate plot
    fig = plot_parallel_coordinate(study)
    fig.write_html(results_dir / f"{study_name}_parallel.html")

    # Slice plot for each parameter
    fig = plot_slice(study)
    fig.write_html(results_dir / f"{study_name}_slice.html")

    print(f"Visualizations saved to {results_dir}")


# Example usage
if __name__ == "__main__":
    from optuna_config import ObjectiveFunction
    from sklearn.model_selection import train_test_split
    from sklearn.datasets import make_classification

    # Load data
    X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create objective
    objective = ObjectiveFunction(X_train, y_train, X_val, y_val, model_type="xgboost")

    # Run optimization
    study = run_optuna_study(
        objective_fn=objective,
        study_name="xgboost_classifier",
        n_trials=100,
        timeout=3600,
        n_jobs=-1,  # Use all cores
        sampler_type="tpe",
        pruner_type="hyperband",
    )

    # Generate visualizations
    visualize_optimization(study, "xgboost_classifier")

```


## Step 4: Set Up Ray Tune for Distributed Optimization (Alternative)

### Code Block 3

```python

# automl/ray_tune_config.py
from ray import tune
from ray.tune.schedulers import ASHAScheduler, PopulationBasedTraining
from ray.tune.search.optuna import OptunaSearch
from ray.tune.search import ConcurrencyLimiter
import xgboost as xgb
from sklearn.metrics import roc_auc_score
import os


def train_xgboost_raytune(config, X_train, y_train, X_val, y_val):
    """
    Training function for Ray Tune (runs in separate worker).
    """
    model = xgb.XGBClassifier(
        max_depth=config["max_depth"],
        learning_rate=config["learning_rate"],
        n_estimators=config["n_estimators"],
        min_child_weight=config["min_child_weight"],
        gamma=config["gamma"],
        subsample=config["subsample"],
        colsample_bytree=config["colsample_bytree"],
        random_state=42,
    )

    # Train with early stopping
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        early_stopping_rounds=50,
        verbose=False,
    )

    # Evaluate
    y_pred = model.predict_proba(X_val)[:, 1]
    score = roc_auc_score(y_val, y_pred)

    # Report to Ray Tune (for ASHA scheduler)
    tune.report(auc=score, done=True)


def run_ray_tune_optimization(X_train, y_train, X_val, y_val):
    """
    Run hyperparameter optimization with Ray Tune.
    """
    # Define search space
    search_space = {
        "max_depth": tune.randint(3, 10),
        "learning_rate": tune.loguniform(1e-3, 0.3),
        "n_estimators": tune.choice([50, 100, 200, 500, 1000]),
        "min_child_weight": tune.loguniform(1, 10),
        "gamma": tune.loguniform(1e-8, 1.0),
        "subsample": tune.uniform(0.5, 1.0),
        "colsample_bytree": tune.uniform(0.5, 1.0),
    }

    # ASHA scheduler (efficient early stopping)
    scheduler = ASHAScheduler(
        metric="auc",
        mode="max",
        max_t=100,  # maximum training iterations
        grace_period=10,  # minimum iterations before stopping
        reduction_factor=3,  # halve trials every X steps
    )

    # Optuna search algorithm (Bayesian optimization)
    search_alg = OptunaSearch(
        metric="auc",
        mode="max",
    )

    # Limit concurrent trials
    search_alg = ConcurrencyLimiter(search_alg, max_concurrent=4)

    # Run optimization
    analysis = tune.run(
        tune.with_parameters(
            train_xgboost_raytune,
            X_train=X_train,
            y_train=y_train,
            X_val=X_val,
            y_val=y_val,
        ),
        config=search_space,
        num_samples=100,  # number of trials
        scheduler=scheduler,
        search_alg=search_alg,
        resources_per_trial={"cpu": 2, "gpu": 0},
        local_dir="automl/ray_results",
        name="xgboost_tune",
        verbose=1,
    )

    # Get best config
    best_config = analysis.get_best_config(metric="auc", mode="max")
    best_trial = analysis.get_best_trial(metric="auc", mode="max")

    print(f"Best trial config: {best_config}")
    print(f"Best trial final AUC: {best_trial.last_result['auc']:.4f}")

    return analysis, best_config


# Example with Population Based Training (PBT)
def run_pbt_optimization(X_train, y_train, X_val, y_val):
    """
    Use Population Based Training for online hyperparameter evolution.
    """
    scheduler = PopulationBasedTraining(
        time_attr="training_iteration",
        metric="auc",
        mode="max",
        perturbation_interval=10,  # perturb every N iterations
        hyperparam_mutations={
            "learning_rate": tune.loguniform(1e-4, 1e-1),
            "subsample": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        },
    )

    analysis = tune.run(
        tune.with_parameters(
            train_xgboost_raytune,
            X_train=X_train,
            y_train=y_train,
            X_val=X_val,
            y_val=y_val,
        ),
        config={
            "max_depth": 6,
            "learning_rate": tune.loguniform(1e-3, 0.3),
            "n_estimators": 500,
            "min_child_weight": 3,
            "gamma": 0.1,
            "subsample": tune.uniform(0.5, 1.0),
            "colsample_bytree": 0.8,
        },
        num_samples=20,  # population size
        scheduler=scheduler,
        resources_per_trial={"cpu": 2},
        local_dir="automl/ray_results",
        name="xgboost_pbt",
    )

    return analysis


if __name__ == "__main__":
    from sklearn.model_selection import train_test_split
    from sklearn.datasets import make_classification

    X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    # Run optimization
    analysis, best_config = run_ray_tune_optimization(X_train, y_train, X_val, y_val)

    # Train final model with best config
    final_model = xgb.XGBClassifier(**best_config, random_state=42)
    final_model.fit(X_train, y_train)

    # Evaluate
    y_pred = final_model.predict_proba(X_val)[:, 1]
    final_auc = roc_auc_score(y_val, y_pred)
    print(f"Final model AUC: {final_auc:.4f}")

```


## Step 5: Track Experiments with MLflow

### Code Block 4

```python

# automl/mlflow_tracking.py
import mlflow
import mlflow.xgboost
from mlflow.tracking import MlflowClient
import optuna
from pathlib import Path


class MLflowCallback:
    """
    Optuna callback to log trials to MLflow.
    """
    def __init__(self, tracking_uri: str, experiment_name: str):
        mlflow.set_tracking_uri(tracking_uri)
        mlflow.set_experiment(experiment_name)
        self.experiment_name = experiment_name

    def __call__(self, study: optuna.Study, trial: optuna.Trial):
        """Log trial to MLflow after completion."""
        with mlflow.start_run(run_name=f"trial_{trial.number}"):
            # Log parameters
            mlflow.log_params(trial.params)

            # Log metrics
            mlflow.log_metric("objective_value", trial.value)

            # Log trial state
            mlflow.set_tag("trial_state", trial.state.name)
            mlflow.set_tag("trial_number", trial.number)

            # Log user attributes if any
            for key, value in trial.user_attrs.items():
                mlflow.log_metric(f"user_attr_{key}", value)


def train_and_log_best_model(study: optuna.Study, X_train, y_train, X_val, y_val):
    """
    Train final model with best parameters and log to MLflow.
    """
    import xgboost as xgb
    from sklearn.metrics import roc_auc_score, accuracy_score, f1_score

    with mlflow.start_run(run_name="best_model"):
        # Log best parameters
        mlflow.log_params(study.best_params)

        # Train model
        model = xgb.XGBClassifier(**study.best_params, random_state=42)
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict_proba(X_val)[:, 1]
        y_pred_binary = model.predict(X_val)

        auc = roc_auc_score(y_val, y_pred)
        accuracy = accuracy_score(y_val, y_pred_binary)
        f1 = f1_score(y_val, y_pred_binary)

        # Log metrics
        mlflow.log_metric("auc", auc)
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("f1", f1)

        # Log model
        mlflow.xgboost.log_model(
            model,
            "model",
            registered_model_name="xgboost_classifier",
        )

        # Log study artifacts
        study_path = Path("automl/results/study.pkl")
        mlflow.log_artifact(study_path)

        print(f"Model logged to MLflow with AUC: {auc:.4f}")

        return model


# Example usage
if __name__ == "__main__":
    from optuna_config import ObjectiveFunction
    from sklearn.model_selection import train_test_split
    from sklearn.datasets import make_classification

    # Set up MLflow
    mlflow.set_tracking_uri("file:./automl/mlruns")

    # Load data
    X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create objective
    objective = ObjectiveFunction(X_train, y_train, X_val, y_val, model_type="xgboost")

    # Create study with MLflow callback
    study = optuna.create_study(direction="maximize")

    mlflow_callback = MLflowCallback(
        tracking_uri="file:./automl/mlruns",
        experiment_name="xgboost_optimization",
    )

    study.optimize(objective, n_trials=50, callbacks=[mlflow_callback])

    # Train and log best model
    final_model = train_and_log_best_model(study, X_train, y_train, X_val, y_val)

```


## Step 6: Deploy Best Model and Monitor Performance

### Code Block 5

```python

# automl/deploy_model.py
import joblib
import json
from pathlib import Path
import optuna
import xgboost as xgb


def save_optimized_model(study: optuna.Study, X_train, y_train, output_dir: str = "automl/models"):
    """
    Train final model with best parameters and save for deployment.
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Train final model
    model = xgb.XGBClassifier(**study.best_params, random_state=42)
    model.fit(X_train, y_train)

    # Save model
    model_path = output_path / "best_model.pkl"
    joblib.dump(model, model_path)

    # Save configuration
    config = {
        "best_params": study.best_params,
        "best_value": study.best_value,
        "n_trials": len(study.trials),
        "study_name": study.study_name,
    }

    config_path = output_path / "model_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    # Save feature names if available
    if hasattr(X_train, "columns"):
        feature_path = output_path / "feature_names.json"
        with open(feature_path, "w") as f:
            json.dump(list(X_train.columns), f)

    print(f"Model saved to {model_path}")
    print(f"Config saved to {config_path}")

    return model


def create_deployment_package(model, model_config: dict, output_dir: str = "automl/deployment"):
    """
    Create deployment package with model, config, and inference script.
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Save model
    joblib.dump(model, output_path / "model.pkl")

    # Save config
    with open(output_path / "config.json", "w") as f:
        json.dump(model_config, f, indent=2)

    # Create inference script
    inference_script = '''
import joblib
import json
import numpy as np

# Load model and config
model = joblib.load("model.pkl")

with open("config.json") as f:
    config = json.load(f)

def predict(features: dict) -> dict:
    """
    Make prediction on input features.

    Args:
        features: Dict of feature_name -> value

    Returns:
        Dict with prediction and probability
    """
    # Convert to array (ensure correct order)
    feature_array = np.array([features[name] for name in config["feature_names"]])

    # Predict
    proba = model.predict_proba([feature_array])[0, 1]
    prediction = int(proba > 0.5)

    return {
        "prediction": prediction,
        "probability": float(proba),
        "model_version": config["model_version"],
    }

if __name__ == "__main__":
    # Test prediction
    test_features = {name: 0.5 for name in config["feature_names"]}
    result = predict(test_features)
    print(result)
'''

    with open(output_path / "inference.py", "w") as f:
        f.write(inference_script)

    print(f"Deployment package created in {output_path}")


# Example usage
if __name__ == "__main__":
    # Load study
    study = joblib.load("automl/results/xgboost_classifier.pkl")

    # Save model
    from sklearn.datasets import make_classification
    X, y = make_classification(n_samples=10000, n_features=20, random_state=42)

    model = save_optimized_model(study, X, y)

    # Create deployment package
    config = {
        "model_version": "1.0",
        "best_params": study.best_params,
        "feature_names": [f"feature_{i}" for i in range(20)],
    }

    create_deployment_package(model, config)

```
