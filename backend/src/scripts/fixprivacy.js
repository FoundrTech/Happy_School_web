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
// 👇 CHANGE THIS
const TARGET_SCHOOL_ID = "Johnson Grammar School - Habsiguda";
function fixTicketPrivacy() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      console.log("🚀 Starting ticket privacy migration...");
      console.log(`🎯 Target school: ${TARGET_SCHOOL_ID}`);
      const ticketSubColRef = db
        .collection("Tickets")
        .doc(TARGET_SCHOOL_ID)
        .collection(TARGET_SCHOOL_ID);
      const ticketSnap = yield ticketSubColRef.get();
      if (ticketSnap.empty) {
        console.log("⚠️ No tickets found for this school");
        process.exit(0);
      }
      let batch = db.batch();
      let batchCount = 0;
      let updatedCount = 0;
      for (const ticketDoc of ticketSnap.docs) {
        const data = ticketDoc.data();
        if (data.privacy === undefined) {
          batch.set(ticketDoc.ref, { privacy: false }, { merge: true });
          batchCount++;
          updatedCount++;
        }
        if (batchCount === 500) {
          yield batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
      if (batchCount > 0) {
        yield batch.commit();
      }
      console.log(`✅ Updated ${updatedCount} tickets`);
      console.log("🎉 PRIVACY MIGRATION COMPLETED SUCCESSFULLY");
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ Migration failed:", error.message);
      } else {
        console.error("❌ Migration failed:", error);
      }
      process.exit(1);
    }
  });
}
fixTicketPrivacy();
