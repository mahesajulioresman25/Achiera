import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRecipePosts() {
    const brand = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' }
    });

    if (!brand) {
        console.log('Brand rasa-ibu not found, skipping recipe seed');
        return;
    }

    const recipes = [
        {
            brandId: brand.id,
            title: 'Sarden Rasa Ibu Tumis Pete',
            slug: 'sarden-tumis-pete',
            description: 'Cara asik menikmati sarden kaleng agar lebih wangi dan menggugah selera keluarga. Kombinasi sarden dengan pete memberikan cita rasa yang unik dan menggugah selera.',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
            authorName: 'Bunda Ani',
            authorAvatar: null,
            duration: 15,
            difficulty: 'Mudah',
            servings: 4,
            ingredients: [
                '1 kaleng Sarden Rasa Ibu',
                '200g Pete, kupas',
                '3 siung bawang putih, cincang',
                '5 buah cabai rawit (sesuai selera)',
                '2 sdm kecap manis',
                '1 sdm minyak goreng',
                'Garam secukupnya'
            ],
            steps: [
                'Panaskan minyak, tumis bawang putih hingga harum',
                'Masukkan pete dan cabai rawit, tumis hingga pete setengah matang',
                'Tambahkan sarden beserta sausnya',
                'Beri kecap manis dan garam, aduk rata',
                'Masak hingga bumbu meresap, angkat dan sajikan'
            ],
            tips: 'Pete bisa diganti dengan buncis atau kacang panjang jika tidak suka pete',
            category: 'Makan Siang',
            tags: ['Praktis', 'Pedas', 'Protein Tinggi'],
            productIds: [],
            likes: 124,
            views: 450,
            isPublished: true,
            isFeatured: true
        },
        {
            brandId: brand.id,
            title: 'Rendang Suwir Crispy',
            slug: 'rendang-suwir-crispy',
            description: 'Kreasi rendang sisa lebaran yang digoreng kering, cocok buat lauk tahan lama. Tekstur crispy di luar namun tetap juicy di dalam.',
            image: 'https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=800&q=80',
            authorName: 'Kak Sari',
            duration: 20,
            difficulty: 'Sedang',
            servings: 6,
            ingredients: [
                '500g Rendang Sapi Rasa Ibu',
                '3 sdm tepung maizena',
                '2 sdm tepung terigu',
                '1 sdt kaldu bubuk',
                'Minyak untuk menggoreng',
                'Cabai rawit untuk taburan (opsional)'
            ],
            steps: [
                'Suwir-suwir rendang hingga halus',
                'Campur tepung maizena, terigu, dan kaldu bubuk',
                'Lumuri rendang dengan campuran tepung',
                'Goreng dalam minyak panas hingga crispy kecoklatan',
                'Tiriskan dan taburi cabai rawit jika suka pedas'
            ],
            tips: 'Pastikan minyak benar-benar panas agar rendang tidak menyerap terlalu banyak minyak',
            category: 'Bekal Anak',
            tags: ['Crispy', 'Tahan Lama', 'Favorit Anak'],
            productIds: [],
            likes: 89,
            views: 320,
            isPublished: true,
            isFeatured: false
        },
        {
            brandId: brand.id,
            title: 'Nasi Goreng Sarden Pedas',
            slug: 'nasi-goreng-sarden-pedas',
            description: 'Sarapan praktis cuma modal nasi kemarin dan sarden Rasa Ibu. Siap dalam 10 menit!',
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80',
            authorName: 'Chef Juna (KW)',
            duration: 10,
            difficulty: 'Mudah',
            servings: 2,
            ingredients: [
                '2 piring nasi putih',
                '1 kaleng Sarden Rasa Ibu',
                '2 butir telur',
                '3 siung bawang putih, cincang',
                '5 cabai rawit merah',
                '2 sdm kecap manis',
                '1 sdm kecap asin',
                'Daun bawang secukupnya'
            ],
            steps: [
                'Tumis bawang putih dan cabai hingga harum',
                'Masukkan telur, orak-arik',
                'Tambahkan sarden, aduk rata',
                'Masukkan nasi, beri kecap manis dan kecap asin',
                'Aduk hingga bumbu merata, taburi daun bawang'
            ],
            tips: 'Gunakan nasi yang sudah dingin agar tidak lengket saat digoreng',
            category: 'Sarapan',
            tags: ['Cepat', 'Praktis', 'Pedas', 'Hemat'],
            productIds: [],
            likes: 215,
            views: 890,
            isPublished: true,
            isFeatured: true
        },
        {
            brandId: brand.id,
            title: 'Nugget Sayur Homemade',
            slug: 'nugget-sayur-homemade',
            description: 'Nugget sehat penuh sayuran untuk si kecil. Tanpa pengawet dan MSG!',
            image: 'https://images.unsplash.com/photo-1619221882018-e5c0e5d6d1e5?w=800&q=80',
            authorName: 'Mama Rara',
            duration: 45,
            difficulty: 'Sedang',
            servings: 20,
            ingredients: [
                '300g daging ayam giling',
                '100g wortel parut',
                '100g brokoli cincang',
                '2 butir telur',
                '100g tepung panir',
                '50g tepung terigu',
                '3 siung bawang putih',
                'Garam dan merica secukupnya'
            ],
            steps: [
                'Campur semua bahan kecuali tepung panir',
                'Bentuk adonan sesuai selera (bulat/kotak)',
                'Gulingkan dalam tepung panir',
                'Simpan di freezer minimal 2 jam',
                'Goreng hingga kecoklatan saat akan dikonsumsi'
            ],
            tips: 'Bisa disimpan di freezer hingga 1 bulan. Goreng langsung tanpa dicairkan.',
            category: 'Camilan',
            tags: ['Sehat', 'Anak-Anak', 'Frozen Food', 'Tanpa MSG'],
            productIds: [],
            likes: 156,
            views: 520,
            isPublished: true,
            isFeatured: false
        },
        {
            brandId: brand.id,
            title: 'Sup Ayam Jahe Hangat',
            slug: 'sup-ayam-jahe-hangat',
            description: 'Sup hangat yang cocok untuk cuaca dingin atau saat sedang kurang enak badan.',
            image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
            authorName: 'Bunda Siti',
            duration: 30,
            difficulty: 'Mudah',
            servings: 4,
            ingredients: [
                '500g ayam potong',
                '3 cm jahe, memarkan',
                '2 batang daun bawang',
                '1 wortel, potong dadu',
                '100g jagung manis',
                '1 liter air',
                'Garam dan merica secukupnya'
            ],
            steps: [
                'Rebus ayam dengan jahe hingga empuk',
                'Masukkan wortel dan jagung',
                'Bumbui dengan garam dan merica',
                'Masak hingga sayuran matang',
                'Taburi daun bawang, sajikan hangat'
            ],
            tips: 'Tambahkan sedikit kecap asin untuk rasa yang lebih gurih',
            category: 'Makan Siang',
            tags: ['Hangat', 'Sehat', 'Comfort Food'],
            productIds: [],
            likes: 78,
            views: 290,
            isPublished: true,
            isFeatured: false
        }
    ];

    for (const recipe of recipes) {
        await prisma.recipePost.upsert({
            where: {
                brandId_slug: {
                    brandId: recipe.brandId,
                    slug: recipe.slug
                }
            },
            create: recipe,
            update: recipe
        });
    }

    console.log(`✅ Seeded ${recipes.length} recipe posts for ${brand.name}`);
}

seedRecipePosts()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
