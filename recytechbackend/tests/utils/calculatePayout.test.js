const { calculatePayoutAmount } = require('../../utils/calculatePayout');
const ExchangeRate = require('../../models/ExchangeRate');

// Mock the ExchangeRate model
jest.mock('../../models/ExchangeRate');

describe('calculatePayoutAmount', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    // 1. Invalid Inputs (Waste Type)
    describe('Invalid waste type', () => {
        it('should return error for null waste type', async () => {
            const result = await calculatePayoutAmount(null, 5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid waste type provided'
            });
        });

        it('should return error for undefined waste type', async () => {
            const result = await calculatePayoutAmount(undefined, 5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid waste type provided'
            });
        });

        it('should return error for non-string waste type', async () => {
            const result = await calculatePayoutAmount(123, 5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid waste type provided'
            });
        });
    });

    // 2. Invalid Inputs (Quantity)
    describe('Invalid quantity', () => {
        it('should return error for 0 quantity', async () => {
            const result = await calculatePayoutAmount('Electronics', 0);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid quantity provided'
            });
        });

        it('should return error for negative quantity', async () => {
            const result = await calculatePayoutAmount('Electronics', -5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid quantity provided'
            });
        });

        it('should return error for non-finite quantity', async () => {
            const result = await calculatePayoutAmount('Electronics', Infinity);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid quantity provided'
            });
        });

        it('should return error for non-numeric quantity', async () => {
            const result = await calculatePayoutAmount('Electronics', 'five');
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Invalid quantity provided'
            });
        });
    });

    // 3. Database Interactions
    describe('Database interaction and rates', () => {
        it('should trim waste type before querying', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: 10,
                isActive: true
            });

            await calculatePayoutAmount('  Plastics  ', 2);
            expect(ExchangeRate.findOne).toHaveBeenCalledWith({
                wasteType: 'Plastics',
                isActive: true
            });
        });

        it('should return error if no active exchange rate is found', async () => {
            ExchangeRate.findOne.mockResolvedValue(null);

            const result = await calculatePayoutAmount('Unknown', 5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'No active exchange rate found for waste type: Unknown'
            });
        });

        it('should return error if rate is negative', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: -5
            });

            const result = await calculatePayoutAmount('Electronics', 2);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'No valid item rate found for waste type: Electronics'
            });
        });

        it('should return error if rate is not finite', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: null,
                ratePerKg: undefined
            });

            const result = await calculatePayoutAmount('Electronics', 2);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'No valid item rate found for waste type: Electronics'
            });
        });
    });

    // 4. Happy Paths and Calculations
    describe('Calculations', () => {
        it('should calculate correct payout using ratePerItem', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: 15.5
            });

            const result = await calculatePayoutAmount('Electronics', 3);
            expect(result).toEqual({
                amount: 46.5,
                success: true,
                message: 'Payout calculated: 3 item(s) x PHP 15.5/item = PHP 46.5',
                exchangeRate: 15.5
            });
        });

        it('should calculate correct payout using ratePerKg when ratePerItem is missing', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerKg: 10.25
            });

            const result = await calculatePayoutAmount('Plastics', 4);
            expect(result).toEqual({
                amount: 41,
                success: true,
                message: 'Payout calculated: 4 item(s) x PHP 10.25/item = PHP 41',
                exchangeRate: 10.25
            });
        });

        it('should prefer ratePerItem over ratePerKg if both are provided', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: 20,
                ratePerKg: 5
            });

            const result = await calculatePayoutAmount('Electronics', 2);
            expect(result).toEqual({
                amount: 40,
                success: true,
                message: 'Payout calculated: 2 item(s) x PHP 20/item = PHP 40',
                exchangeRate: 20
            });
        });

        it('should correctly round to 2 decimal places', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: 10.125
            });

            // 3 * 10.125 = 30.375 -> rounded to 30.38
            const result = await calculatePayoutAmount('Metal', 3);
            expect(result).toEqual({
                amount: 30.38,
                success: true,
                message: 'Payout calculated: 3 item(s) x PHP 10.125/item = PHP 30.38',
                exchangeRate: 10.125
            });
        });

        it('should correctly round to 2 decimal places (down)', async () => {
            ExchangeRate.findOne.mockResolvedValue({
                ratePerItem: 10.124
            });

            // 1 * 10.124 = 10.124 -> rounded to 10.12
            const result = await calculatePayoutAmount('Metal', 1);
            expect(result).toEqual({
                amount: 10.12,
                success: true,
                message: 'Payout calculated: 1 item(s) x PHP 10.124/item = PHP 10.12',
                exchangeRate: 10.124
            });
        });
    });

    // 5. Error Handling
    describe('Error handling', () => {
        it('should catch errors from database and return a formatted error object', async () => {
            ExchangeRate.findOne.mockRejectedValue(new Error('Database connection failed'));

            const result = await calculatePayoutAmount('Electronics', 5);
            expect(result).toEqual({
                amount: 0,
                success: false,
                message: 'Error calculating payout: Database connection failed'
            });
        });
    });
});
