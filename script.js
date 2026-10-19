import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const symptomInput = document.getElementById("symptomInput");
const symptomList = document.getElementById("symptomList");

async function saveSymptom() {
  const symptom = symptomInput.value.trim();

  if (!symptom) {
    alert("Please enter a symptom.");
    return;
  }

  try {
    await addDoc(collection(db, "symptoms"), {
      symptom,
      createdAt: new Date().toISOString()
    });

    symptomInput.value = "";

    getSymptoms();
  } catch (error) {
    console.error("Error saving symptom:", error);
  }
}

window.saveSymptom = saveSymptom;

async function getSymptoms() {
  try {
    const querySnapshot = await getDocs(
      collection(db, "symptoms")
    );

    symptomList.innerHTML = "";

    querySnapshot.forEach((document_) => {
      const li = document.createElement("li");

      li.textContent = document_.data().symptom + " ";

      const button = document.createElement("button");

      button.textContent = "Delete";

      button.addEventListener("click", () => {
        deleteSymptom(document_.id);
      });

      li.appendChild(button);

      symptomList.appendChild(li);
    });
  } catch (error) {
    console.error("Error getting symptoms:", error);
  }
}

async function deleteSymptom(id) {
  try {
    await deleteDoc(doc(db, "symptoms", id));

    getSymptoms();
  } catch (error) {
    console.error("Error deleting symptom:", error);
  }
}

window.deleteSymptom = deleteSymptom;

getSymptoms();