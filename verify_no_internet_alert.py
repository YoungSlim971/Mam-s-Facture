import asyncio
from playwright.async_api import async_playwright, Dialog

APP_URL = "http://localhost:5174" # Updated port
PAGES_TO_CHECK = ["/", "/factures", "/clients"]
CONSOLE_ERRORS = []
DIALOG_DETECTED = False

def handle_dialog(dialog: Dialog):
    global DIALOG_DETECTED
    DIALOG_DETECTED = True
    print(f"UNEXPECTED DIALOG DETECTED: type={dialog.type}, message='{dialog.message}'")
    asyncio.create_task(dialog.dismiss()) # Dismiss it anyway

def handle_console_error(msg):
    if msg.type.lower() == 'error':
        print(f"CONSOLE ERROR: {msg.text}")
        CONSOLE_ERRORS.append(msg.text)

async def main():
    global DIALOG_DETECTED
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for unexpected dialogs
        page.on("dialog", handle_dialog)
        # Listen for console errors
        page.on("console", handle_console_error)

        for path in PAGES_TO_CHECK:
            DIALOG_DETECTED = False # Reset for each page
            url_to_visit = APP_URL + path
            print(f"Navigating to {url_to_visit}...")
            try:
                await page.goto(url_to_visit, wait_until="networkidle", timeout=10000)
                await page.wait_for_timeout(1000) # Allow for any async UI updates

                if DIALOG_DETECTED:
                    print(f"FAIL: Internet alert dialog was detected on {url_to_visit}")
                    # No need to proceed further if this fails
                    await browser.close()
                    return False
                else:
                    print(f"SUCCESS: No internet alert dialog detected on {url_to_visit}")

            except Exception as e:
                print(f"Error during navigation or check on {url_to_visit}: {e}")
                await browser.close()
                return False

        await browser.close()

    if CONSOLE_ERRORS:
        print(f"FAIL: Console errors detected during navigation.")
        for err in CONSOLE_ERRORS:
            print(f"- {err}")
        return False

    print("SUCCESS: All checks passed. No unexpected dialogs and no console errors.")
    return True

if __name__ == "__main__":
    if asyncio.run(main()):
        print("Test PASSED")
    else:
        print("Test FAILED")
