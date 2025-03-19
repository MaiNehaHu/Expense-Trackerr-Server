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
              // Validate time in HH:mm AM/PM format
              return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time! Use format HH:mm AM/PM.`,
          },
        },
        everyWeek: {
          type: String,
        },
        everyMonth: {
          type: Number,
          min: 1,
          max: 31,
        },
        everyYear: {
          month: {
            type: Number,
            min: 1,
            max: 31,
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
        enum: ["Spent", "Earned", "Borrowed", "Lend"],
        default: "Spent",
      },
      _id: { type: String, required: true },
    },
    people: {
      name: { type: String },
      contact: { type: Number },
      relation: { type: String }
    },
    image: { type: String },
    pushedIntoTransactions: { type: Boolean, default: false },
    lastPushedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Middleware to set default values dynamically based on the interval
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
        this.recuring.when.everyYear = { month: "January", date: 1 };
      } else {
        if (!when.everyYear.month)
          this.recuring.when.everyYear.month = "January";
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
