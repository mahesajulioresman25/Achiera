const mockGrabFoodText = `
Merchant Payout Report
Store: Achiera Rasa Ibu
Payout Period: 01 Jan 2026 - 02 Jan 2026
Payout Date: 03 Jan 2026

Order Summary:
1. Order ID: GF-12345
   Date: 2026-01-01 10:30
   Order Amount: Rp 50.000
   Commission (15%): -Rp 7.500
   Merchant Service Fee: -Rp 1.000
   Net Amount: Rp 41.500

2. Order ID: GF-67890
   Date: 2026-01-02 14:20
   Order Amount: Rp 100.000
   Commission (15%): -Rp 15.000
   Merchant Service Fee: -Rp 1.000
   Net Amount: Rp 84.000

Total Payout: Rp 125.500
`;

// Logic to test how the prompt would be sent
console.log("MOCK GRABFOOD TEXT LOADED");
console.log("========================");
console.log(mockGrabFoodText);
console.log("========================");
console.log("SIMULATING AI EXTRACTION...");

// This script only validates the internal structure of the prompt
// For actual AI validation, I will explain the prompt logic to the user.
