"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threeLevelCategories = void 0;
exports.threeLevelCategories = [
    {
        id: 'cat-1',
        name: 'إلكترونيات',
        slug: 'electronics',
        children: [
            {
                id: 'cat-1-1',
                name: 'موبايلات',
                slug: 'mobile',
                children: [
                    { id: 'cat-1-1-1', name: 'هواتف ذكية', slug: 'smartphones' },
                    { id: 'cat-1-1-2', name: 'أجهزة لوحية', slug: 'tablets' },
                    { id: 'cat-1-1-3', name: 'إكسسوارات موبايل', slug: 'mobile-accessories' },
                ],
            },
            {
                id: 'cat-1-2',
                name: 'أجهزة كمبيوتر',
                slug: 'computers',
                children: [
                    { id: 'cat-1-2-1', name: 'لابتوب', slug: 'laptops' },
                    { id: 'cat-1-2-2', name: 'شاشات', slug: 'monitors' },
                    { id: 'cat-1-2-3', name: 'ملحقات كمبيوتر', slug: 'computer-accessories' },
                ],
            },
            {
                id: 'cat-1-3',
                name: 'أجهزة منزلية',
                slug: 'home-appliances',
                children: [
                    { id: 'cat-1-3-1', name: 'ثلاجات', slug: 'refrigerators' },
                    { id: 'cat-1-3-2', name: 'غسالات', slug: 'washing-machines' },
                    { id: 'cat-1-3-3', name: 'ميكروويف', slug: 'microwaves' },
                ],
            },
        ],
    },
    {
        id: 'cat-2',
        name: 'موضة',
        slug: 'fashion',
        children: [
            {
                id: 'cat-2-1',
                name: 'رجالي',
                slug: 'mens',
                children: [
                    { id: 'cat-2-1-1', name: 'قمصان', slug: 'shirts' },
                    { id: 'cat-2-1-2', name: 'بناطيل', slug: 'trousers' },
                    { id: 'cat-2-1-3', name: 'أحذية', slug: 'mens-shoes' },
                ],
            },
            {
                id: 'cat-2-2',
                name: 'نسائي',
                slug: 'womens',
                children: [
                    { id: 'cat-2-2-1', name: 'فساتين', slug: 'dresses' },
                    { id: 'cat-2-2-2', name: 'حقائب', slug: 'handbags' },
                    { id: 'cat-2-2-3', name: 'إكسسوارات نسائية', slug: 'womens-accessories' },
                ],
            },
            {
                id: 'cat-2-3',
                name: 'أطفال',
                slug: 'kids',
                children: [
                    { id: 'cat-2-3-1', name: 'ملابس أطفال', slug: 'kids-clothing' },
                    { id: 'cat-2-3-2', name: 'ألعاب', slug: 'toys' },
                ],
            },
        ],
    },
    {
        id: 'cat-3',
        name: 'منزل ومطبخ',
        slug: 'home-kitchen',
        children: [
            {
                id: 'cat-3-1',
                name: 'أثاث',
                slug: 'furniture',
                children: [
                    { id: 'cat-3-1-1', name: 'صالات', slug: 'living-rooms' },
                    { id: 'cat-3-1-2', name: 'غرف نوم', slug: 'bedrooms' },
                    { id: 'cat-3-1-3', name: 'مكاتب', slug: 'desks' },
                ],
            },
            {
                id: 'cat-3-2',
                name: 'أدوات المطبخ',
                slug: 'kitchenware',
                children: [
                    { id: 'cat-3-2-1', name: 'أواني طهي', slug: 'cookware' },
                    { id: 'cat-3-2-2', name: 'أجهزة مطبخ', slug: 'kitchen-appliances' },
                ],
            },
        ],
    },
    {
        id: 'cat-4',
        name: 'الصحة والجمال',
        slug: 'beauty-health',
        children: [
            {
                id: 'cat-4-1',
                name: 'عناية بالبشرة',
                slug: 'skincare',
                children: [
                    { id: 'cat-4-1-1', name: 'مستحضرات تجميل', slug: 'cosmetics' },
                    { id: 'cat-4-1-2', name: 'عناية بالشعر', slug: 'hair-care' },
                ],
            },
            {
                id: 'cat-4-2',
                name: 'عطور',
                slug: 'perfumes',
                children: [
                    { id: 'cat-4-2-1', name: 'عطور رجالية', slug: 'mens-perfumes' },
                    { id: 'cat-4-2-2', name: 'عطور نسائية', slug: 'womens-perfumes' },
                ],
            },
        ],
    },
];
//# sourceMappingURL=categories.js.map