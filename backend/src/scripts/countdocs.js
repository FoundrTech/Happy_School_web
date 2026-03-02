"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const firebaseAdmin_1 = __importDefault(require("../config/firebaseAdmin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db = firebaseAdmin_1.default.firestore();
const schoolName = "Johnson Grammar School - Habsiguda";
function countPublicTickets() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      console.log("🔍 Counting public tickets...");
      const ticketsRef = db
        .collection("Tickets")
        .doc(schoolName)
        .collection(schoolName)
        .where("privacy", "==", false); // 👈 CONDITION ADDED
      const snapshot = yield ticketsRef.count().get();
      const publicTicketCount = snapshot.data().count;
      console.log(
        `✅ Public Tickets (privacy == false) for ${schoolName}:`,
        publicTicketCount,
      );
      process.exit(0);
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  });
}
countPublicTickets();
