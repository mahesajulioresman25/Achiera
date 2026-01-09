import { initializeChartOfAccounts } from './src/lib/intelligence/chartOfAccounts';

async function fix() {
    const brandId = 'cmjfzw4890001cpfuc6434i22';
    console.log('Starting CoA initialization for Rasa Ibu...');
    const res = await initializeChartOfAccounts(brandId);
    console.log('Result:', res);
}

fix();
