'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLayout = useLayout;
const categories_1 = require("@/data/categories");
// Placeholder layout data source — swap the categories array with the real
// API query once the categories endpoint is implemented.
function useLayout() {
    return { categories: categories_1.threeLevelCategories };
}
//# sourceMappingURL=useLayout.js.map