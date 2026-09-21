#!/usr/bin/env python3
"""
ComfyUI Remote Client for Ribbit's Big Adventure (RBA)
Connects to Ghost via Tailscale to trigger Qwen Image 2.1 generations.
"""

import argparse
import json
import os
import random
import sys
import time
import urllib.parse
import urllib.request
from PIL import Image

DEFAULT_HOST = os.environ.get("COMFY_HOST", "http://100.91.88.61:8188")

def build_qwen_prompt_graph(
    prompt: str,
    negative_prompt: str = "blurry, low quality, distorted, bad anatomy, text, watermark",
    width: int = 1024,
    height: int = 1024,
    steps: int = 25,
    cfg: float = 1.0,
    seed: int = None,
    filename_prefix: str = "RBA_Ribbit",
    transparent: bool = True
) -> dict:
    """
    Constructs the exact Qwen Image 2.1 GGUF node execution graph for ComfyUI.
    """
    if seed is None:
        seed = random.randint(100000000000, 999999999999)

    formatted_prompt = prompt.strip()
    if transparent:
        formatted_prompt = (
            f"This is an RGBA format image with transparency. {formatted_prompt}. "
            f"The image has an alpha channel and a transparent background."
        )

    resolution = max(width, height)

    workflow = {
        "1": {
            "inputs": {
                "unet_name": "qwen-image-2.1-Q4_K_M.gguf"
            },
            "class_type": "UnetLoaderGGUF",
            "_meta": {"title": "Unet Loader (GGUF)"}
        },
        "2": {
            "inputs": {
                "clip_name": "qwen3vl_8b_int8_convrot.safetensors",
                "type": "qwen_image",
                "device": "default"
            },
            "class_type": "CLIPLoader",
            "_meta": {"title": "Load CLIP"}
        },
        "3": {
            "inputs": {
                "vae_name": "qwen_image_2.1_vae_bf16.safetensors"
            },
            "class_type": "VAELoader",
            "_meta": {"title": "Load VAE"}
        },
        "4": {
            "inputs": {
                "prompt": formatted_prompt,
                "negative_prompt": negative_prompt,
                "resolution": resolution,
                "clip": ["2", 0]
            },
            "class_type": "TextEncodeQwenImage21",
            "_meta": {"title": "Text Encode Qwen Image 2.1"}
        },
        "5": {
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage",
            "_meta": {"title": "Empty Latent Image"}
        },
        "6": {
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["4", 0],
                "negative": ["4", 1],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler",
            "_meta": {"title": "KSampler"}
        },
        "7": {
            "inputs": {
                "samples": ["6", 0],
                "vae": ["3", 0]
            },
            "class_type": "VAEDecode",
            "_meta": {"title": "VAE Decode"}
        },
        "8": {
            "inputs": {
                "filename_prefix": filename_prefix,
                "images": ["7", 0]
            },
            "class_type": "SaveImage",
            "_meta": {"title": "Save Image"}
        }
    }
    return workflow

def check_comfy_status(host: str) -> dict:
    """Verifies that ComfyUI is online and reachable."""
    try:
        url = f"{host.rstrip('/')}/system_stats"
        req = urllib.request.urlopen(url, timeout=5)
        return json.loads(req.read().decode("utf-8"))
    except Exception as e:
        print(f"Error connecting to ComfyUI at {host}: {e}")
        return {}

def queue_prompt(host: str, workflow: dict) -> str:
    """Submits the workflow prompt to ComfyUI and returns prompt_id."""
    url = f"{host.rstrip('/')}/prompt"
    payload = json.dumps({"prompt": workflow}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    response = urllib.request.urlopen(req, timeout=10)
    data = json.loads(response.read().decode("utf-8"))
    return data.get("prompt_id")

def wait_for_execution(host: str, prompt_id: str, poll_interval: float = 3.0, max_wait: float = 600.0) -> list:
    """
    Polls ComfyUI history endpoint until execution finishes.
    Returns list of generated image descriptors.
    """
    start_time = time.time()
    url = f"{host.rstrip('/')}/history/{prompt_id}"

    print(f"Waiting for prompt {prompt_id} to finish rendering on Ghost...")
    while time.time() - start_time < max_wait:
        try:
            req = urllib.request.urlopen(url, timeout=5)
            history = json.loads(req.read().decode("utf-8"))
            if prompt_id in history:
                prompt_data = history[prompt_id]
                status = prompt_data.get("status", {})
                if status.get("completed", False) or "outputs" in prompt_data:
                    outputs = prompt_data.get("outputs", {})
                    images = []
                    for node_id, out in outputs.items():
                        if "images" in out:
                            images.extend(out["images"])
                    return images
        except Exception:
            pass
        time.sleep(poll_interval)

    raise TimeoutError(f"Generation timed out after {max_wait} seconds.")

def download_image(host: str, filename: str, subfolder: str, folder_type: str, dest_path: str):
    """Downloads an output image from ComfyUI to local disk."""
    params = urllib.parse.urlencode({
        "filename": filename,
        "subfolder": subfolder,
        "type": folder_type
    })
    url = f"{host.rstrip('/')}/view?{params}"
    os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
    urllib.request.urlretrieve(url, dest_path)
    print(f"Saved generated image to: {dest_path}")

def downscale_to_pixel_art(image_path: str, target_size: tuple, output_path: str):
    """Resizes high-resolution output down to retro pixel art using nearest-neighbor."""
    with Image.open(image_path) as img:
        img_resized = img.resize(target_size, resample=Image.Resampling.NEAREST)
        img_resized.save(output_path)
        print(f"Downscaled pixel art saved to: {output_path} ({target_size[0]}x{target_size[1]})")

def main():
    parser = argparse.ArgumentParser(description="Trigger Qwen Image 2.1 art generation on Ghost via ComfyUI")
    parser.add_argument("--prompt", required=True, help="Text description of the game asset to generate")
    parser.add_argument("--out", required=True, help="Destination file path for the output PNG")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"ComfyUI host URL (default: {DEFAULT_HOST})")
    parser.add_argument("--width", type=int, default=1024, help="Width in pixels (default: 1024)")
    parser.add_argument("--height", type=int, default=1024, help="Height in pixels (default: 1024)")
    parser.add_argument("--steps", type=int, default=25, help="Diffusion steps (default: 25)")
    parser.add_argument("--cfg", type=float, default=1.0, help="Classifier free guidance (default: 1.0)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed (optional)")
    parser.add_argument("--no-transparent", action="store_true", help="Disable automatic alpha/transparency formatting")
    parser.add_argument("--pixel-size", type=str, default=None, help="Downscale target size for pixel art, e.g. '48x48' or '64x64'")

    args = parser.parse_args()

    # Verify connection
    stats = check_comfy_status(args.host)
    if not stats:
        print(f"Could not connect to ComfyUI on {args.host}.")
        sys.exit(1)

    devices = stats.get("devices", [])
    gpu_name = devices[0].get("name", "Unknown GPU") if devices else "CPU"
    print(f"Connected to Ghost ComfyUI ({gpu_name})")

    # Build graph
    workflow = build_qwen_prompt_graph(
        prompt=args.prompt,
        width=args.width,
        height=args.height,
        steps=args.steps,
        cfg=args.cfg,
        seed=args.seed,
        filename_prefix="RBA_Ribbit",
        transparent=not args.no_transparent
    )

    # Queue prompt
    prompt_id = queue_prompt(args.host, workflow)
    print(f"Queued generation job: {prompt_id}")

    # Wait for completion
    images = wait_for_execution(args.host, prompt_id)
    if not images:
        print("Error: No images returned from ComfyUI.")
        sys.exit(1)

    first_image = images[0]
    download_image(
        args.host,
        first_image["filename"],
        first_image.get("subfolder", ""),
        first_image.get("type", "output"),
        args.out
    )

    # Optional pixel art downscaling
    if args.pixel_size:
        try:
            pw, ph = map(int, args.pixel_size.lower().split("x"))
            downscale_to_pixel_art(args.out, (pw, ph), args.out)
        except Exception as e:
            print(f"Warning: Failed to downscale pixel size: {e}")

    print("Asset generation complete.")

if __name__ == "__main__":
    main()
