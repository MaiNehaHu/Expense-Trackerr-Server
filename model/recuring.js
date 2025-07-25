const mongoose = require("mongoose");

const recuringTransactionSchema = new mongoose.Schema(
  {
    recuring: {
      count: { type: Number, default: 1, required: true },
      pushedCount: { type: Number, default: 0, required: true },
      interval: {
        type: String,
        default: "Everyday",
        enum: ["Everyday", "Every week", "Every month", "Every year"],
      },
      when: {
        everyDay: {
          type: String,
          validate: {
            validator: function (v) {
              return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time! Use format HH:mm AM/PM.`,
          },
        },
        everyWeek: {
          type: String,
          enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        },
        everyMonth: {
          type: Number,
          min: 1,
          max: 31,
        },
        everyYear: {
          month: {
            type: Number, // fixed: should be 1-12
            min: 1,
            max: 12,
          },
          date: {
            type: Number,
            min: 1,
            max: 31,
          },
        },
      },
    },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    category: {
      hexColor: { type: String, default: "#707070" },
      name: { type: String, default: "Others" },
      sign: { type: String, default: "-", enum: ["+", "-"] },
      type: {
        type: String,
        enum: ["Spent", "Earned", "Borrowed", "Lent"],
        default: "Spent",
      },
      _id: { type: String, required: true },
    },
    people: {
      name: { type: String },
      contact: { type: Number },
      relation: { type: String },
    },
    image: { type: String },
    pushedIntoTransactions: { type: Boolean, default: false },
    lastPushedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recuringTransactionSchema.pre("save", function (next) {
  const { interval, when } = this.recuring;

  switch (interval) {
    case "Everyday":
      if (!when.everyDay) {
        this.recuring.when.everyDay = "08:00 AM";
      }
      break;
    case "Every week":
      if (!when.everyWeek) {
        this.recuring.when.everyWeek = "Monday";
      }
      break;
    case "Every month":
      if (!when.everyMonth) {
        this.recuring.when.everyMonth = 1;
      }
      break;
    case "Every year":
      if (!when.everyYear) {
        this.recuring.when.everyYear = { month: 1, date: 1 };
      } else {
        if (!when.everyYear.month) this.recuring.when.everyYear.month = 1;
        if (!when.everyYear.date) this.recuring.when.everyYear.date = 1;
      }
      break;
  }

  next();
});

module.exports = mongoose.model(
  "RecuringTransaction",
  recuringTransactionSchema
);
