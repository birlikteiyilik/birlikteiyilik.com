"""Browser regression for actual QR decoding, including short landscape screens.

Serve the repository, install _src/requirements-qr-tree-qa.txt, then run:
python tests/qr-tree.browser.py --url http://127.0.0.1:8080
"""
import argparse
import io
import shutil

from PIL import Image
from playwright.sync_api import expect, sync_playwright
import zxingcpp

DESTINATION = "https://birlikteiyilik.com/qr"


def check_code(tree):
    stage = tree.locator(".gt-stage").bounding_box()
    artwork = tree.locator(".gt-qr img")
    image = artwork.bounding_box()
    assert image["x"] >= stage["x"] - .5 and image["y"] >= stage["y"] - .5
    assert image["x"] + image["width"] <= stage["x"] + stage["width"] + .5
    assert image["y"] + image["height"] <= stage["y"] + stage["height"] + .5
    result = zxingcpp.read_barcode(Image.open(io.BytesIO(artwork.screenshot())).convert("RGB"))
    assert result is not None, "Rendered QR could not be decoded"
    assert result.text == DESTINATION, result.text
    expect(tree.locator(".gt-destination")).to_have_attribute("href", DESTINATION)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8080")
    args = parser.parse_args()
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=shutil.which("chromium"),
            args=["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
        )
        for width, height in [(1440, 1000), (390, 844), (844, 390)]:
            context = browser.new_context(viewport={"width": width, "height": height})
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(args.url.rstrip("/") + "/iyilik-agaci/", wait_until="networkidle")
            tree = page.locator("[data-goodness-tree]")
            expect(tree).to_have_attribute("data-tree-ready", "true", timeout=30000)
            for label in ["Filiz", "Bahar", "Bereket"]:
                tree.get_by_role("button", name=label, exact=True).click()
                tree.get_by_role("button", name="QR kodunu göster", exact=True).click()
                expect(tree).to_have_attribute("data-view", "qr", timeout=15000)
                check_code(tree)
                tree.get_by_role("button", name="Ağaca dön", exact=True).click()
                expect(tree).to_have_attribute("data-view", "tree", timeout=15000)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            print(f"{width}×{height}: all three themes decode to {DESTINATION}", flush=True)
            context.close()
        context = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        page = context.new_page()
        page.goto(args.url.rstrip("/") + "/iyilik-agaci/", wait_until="networkidle")
        check_code(page.locator("[data-goodness-tree]"))
        context.close()
        browser.close()
    assert not errors, errors
    print("QR layout, destination, theme conversion, and JavaScript-free fallback passed.")


if __name__ == "__main__":
    main()
