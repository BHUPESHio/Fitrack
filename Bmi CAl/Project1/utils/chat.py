from flask import Blueprint, request, jsonify, render_template,send_file
from utils.gemini_bot import generate_reply
from werkzeug.utils import secure_filename
import base64
from flask_login import current_user, login_required
from pymongo import MongoClient
from bson import ObjectId
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


# MongoDB connection
MONGO_URI = "mongodb+srv://Admin:bait1783@fitrackdb.o4yvman.mongodb.net/?retryWrites=true&w=majority&appName=fitrackdb"
mongo = MongoClient(MONGO_URI)
db = mongo["myDatabase"]
chats = db["chat_history"]

# Blueprint
chat_bp = Blueprint("chat", __name__)

# Route: Health Chat API
@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    user_input = request.form.get("message")
    file = request.files.get("file")

    if not user_input:
        return jsonify({"error": "Message is required"}), 400

    # Prepare file data (future: vision API)
    file_data = None
    filename = None
    if file:
        filename = secure_filename(file.filename)
        file_content = file.read()
        file_data = {
            "mime_type": file.mimetype,
            "data": base64.b64encode(file_content).decode("utf-8")
        }

    try:
        reply = generate_reply(user_input, file_data=file_data)
    except Exception as e:
        reply = "An error occurred while processing your request."

    # Store chat in MongoDB
    chats.insert_one({
        "user_id": str(current_user.get_id()),
        "question": user_input,
        "reply": reply,
        "file_used": filename if file else None
    })

    return jsonify({"reply": reply})

@chat_bp.route("/api/chat/history", methods=["GET"])
def get_chat_history():
    user_id = str(current_user.get_id())
    history = list(chats.find({"user_id": user_id}).sort("_id", -1).limit(20))
    for chat in history:
        chat["_id"] = str(chat["_id"])
    return jsonify(history)

@chat_bp.route("/api/chat/history/<chat_id>", methods=["GET"])
def get_chat_by_id(chat_id):
    chat = chats.find_one({"_id": ObjectId(chat_id)})
    if not chat or str(chat["user_id"]) != str(current_user.get_id()):
        return jsonify({"error": "Chat not found"}), 404
    return jsonify({
        "question": chat["question"],
        "reply": chat["reply"]
    })

@chat_bp.route("/api/chat/pdf/<chat_id>", methods=["GET"])
def download_chat_pdf(chat_id):
    chat = chats.find_one({"_id": ObjectId(chat_id)})
    if not chat or str(chat["user_id"]) != str(current_user.get_id()):
        return jsonify({"error": "Chat not found"}), 404

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica", 12)
    textobject = c.beginText(50, height - 50)
    textobject.textLine("Question:")
    textobject.textLines(chat["question"])
    textobject.textLine("")
    textobject.textLine("Response:")
    textobject.textLines(chat["reply"])
    c.drawText(textobject)
    c.showPage()
    c.save()

    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="chat_response.pdf", mimetype='application/pdf')
@chat_bp.route("/api/chat/delete/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    result = chats.delete_one({"_id": ObjectId(chat_id), "user_id": current_user.get_id()})
    return jsonify({"success": result.deleted_count > 0})


# Chat page route
@chat_bp.route("/chat")
@login_required
def chat_page():
    return render_template("chat.html",user=current_user)
