/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;

    const decimalDiscount = discount / 100;

    const fullPrice = sale_price * quantity;

    const revenue = fullPrice * (1 - decimalDiscount);

    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    // 15% — для продавца, который принёс наибольшую прибыль.
    // 10% — для продавцов, которые по прибыли находятся на втором и третьем месте.
    // 5% — для всех остальных продавцов, кроме самого последнего.
    // 0% — для продавца на последнем месте.
    const { profit } = seller
    if (index === 0) {
        return +(profit * 0.15).toFixed(2);
    } else if (index === 1 || index === 2) {
        return +(profit * 0.10).toFixed(2);
    } else if (index === total - 1) {
        return 0;
    } else { // Для всех остальных
        return +(profit * 0.05).toFixed(2);
    }

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка входных данных
    if (!data
    || !Array.isArray(data.sellers)
    || !Array.isArray(data.products)
    || !Array.isArray(data.purchase_records)
    || data.sellers.length === 0
    || data.products.length === 0
    || data.purchase_records.length === 0) {
        throw new Error("Некорректные данные ")
    }

    // @TODO: Проверка наличия опций
    if (typeof options !== "object"
    || typeof calculateRevenue !== "function"
    || typeof calculateBonus !== "function") {
        throw new Error("Неверные параметры")
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const stats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(data.sellers.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        const sellerStats = stats.find(item => item.id === seller.id);
        if (sellerStats) {
            sellerStats.sales_count++;
            
            // Суммируем выручку от всех товаров в чеке
            let recordRevenue = 0;
            record.items.forEach(item => {
                const rev = calculateRevenue(item);
                recordRevenue += rev;
                
                const product = productIndex[item.sku];
                const cost = product.purchase_price * item.quantity;
                sellerStats.profit += rev - cost;

                if (!sellerStats.products_sold[item.sku]) {
                    sellerStats.products_sold[item.sku] = 0;
                }
                sellerStats.products_sold[item.sku] += item.quantity;
            });
            sellerStats.revenue += recordRevenue;
        }
    });

    // @TODO: Сортировка продавцов по прибыли
    stats.sort((a, b) => (a.profit - b.profit) * -1);

    // @TODO: Назначение премий на основе ранжирования
    stats.forEach((seller, index, arr) => {
        seller.bonus = calculateBonus(index, arr.length, seller);// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
            .sort((a, b) => b[1] - a[1])
            .filter((item, index) => index < 10)
            .map(item => {
                return { sku: item[0], quantity: item[1] }
            });// Формируем топ-10 товаров
    })

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return stats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus,
    }));

}
