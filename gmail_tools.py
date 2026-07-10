from get_creds import get_gmail_service
from email_parser import extract_transaction_info
import base64
from db import init_db, save_transaction, clear_db, print_head

def mark_messages_as_read(service, message_ids):
    for message_id in message_ids:
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]}
        ).execute()

def get_unread_rbc_ids():
    service = get_gmail_service()

    results = service.users().messages().list(
        userId="me",
        q="is:unread from:jakhiccup@icloud.com"
    ).execute()

    messages = results.get("messages", [])
    subjects = []
    message_ids = []

    for message in messages:
        message_ids.append(message["id"])

        msg = service.users().messages().get(
            userId="me",
            id=message["id"]
        ).execute()

        headers = msg.get("payload", {}).get("headers", [])

        for header in headers:
            if header["name"] == "Subject":
                subjects.append(header["value"])
                break

    return service, subjects, message_ids


def extract_text_body_from_message(msg):
    payload = msg.get("payload", {})

    def decode_data(data):
        if not data:
            return ""
        return base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    def walk_parts(parts):
        for part in parts:
            mime_type = part.get("mimeType", "")

            if mime_type == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    return decode_data(data)

            nested_parts = part.get("parts", [])
            if nested_parts:
                result = walk_parts(nested_parts)
                if result:
                    return result

        return ""

    parts = payload.get("parts", [])
    if parts:
        text_body = walk_parts(parts)
        if text_body:
            return text_body

    return decode_data(payload.get("body", {}).get("data"))


def get_email_bodies_by_ids(service, message_ids):
    bodies = {}

    for message_id in message_ids:
        msg = service.users().messages().get(
            userId="me",
            id=message_id,
            format="full"
        ).execute()

        bodies[message_id] = extract_text_body_from_message(msg)

    return bodies

