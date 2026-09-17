// Bangladesh's 8 divisions and 64 districts, each with an approximate
// center coordinate. Used to populate filter dropdowns and to let the
// map jump to any area — even ones with no claimed territory yet.

export interface Region {
    name: string;
    center: [number, number]; // [lat, lng]
}

export interface District extends Region {
    division: string;
}

export const DIVISIONS: Region[] = [
    { name: 'Dhaka', center: [23.8103, 90.4125] },
    { name: 'Chattogram', center: [22.3569, 91.7832] },
    { name: 'Khulna', center: [22.8456, 89.5403] },
    { name: 'Rajshahi', center: [24.3745, 88.6042] },
    { name: 'Barishal', center: [22.7010, 90.3535] },
    { name: 'Sylhet', center: [24.8949, 91.8687] },
    { name: 'Rangpur', center: [25.7439, 89.2752] },
    { name: 'Mymensingh', center: [24.7471, 90.4203] },
];

export const DISTRICTS: District[] = [
    // Dhaka Division
    { name: 'Dhaka', division: 'Dhaka', center: [23.8103, 90.4125] },
    { name: 'Faridpur', division: 'Dhaka', center: [23.6070, 89.8429] },
    { name: 'Gazipur', division: 'Dhaka', center: [23.9999, 90.4203] },
    { name: 'Gopalganj', division: 'Dhaka', center: [23.0050, 89.8266] },
    { name: 'Kishoreganj', division: 'Dhaka', center: [24.4260, 90.9847] },
    { name: 'Madaripur', division: 'Dhaka', center: [23.1641, 90.1897] },
    { name: 'Manikganj', division: 'Dhaka', center: [23.8644, 90.0047] },
    { name: 'Munshiganj', division: 'Dhaka', center: [23.5422, 90.5305] },
    { name: 'Narayanganj', division: 'Dhaka', center: [23.6238, 90.5000] },
    { name: 'Narsingdi', division: 'Dhaka', center: [23.9322, 90.7150] },
    { name: 'Rajbari', division: 'Dhaka', center: [23.7574, 89.6444] },
    { name: 'Shariatpur', division: 'Dhaka', center: [23.2423, 90.4348] },
    { name: 'Tangail', division: 'Dhaka', center: [24.2513, 89.9167] },

    // Chattogram Division
    { name: 'Chattogram', division: 'Chattogram', center: [22.3569, 91.7832] },
    { name: 'Bandarban', division: 'Chattogram', center: [22.1953, 92.2184] },
    { name: 'Brahmanbaria', division: 'Chattogram', center: [23.9571, 91.1119] },
    { name: 'Chandpur', division: 'Chattogram', center: [23.2333, 90.6667] },
    { name: 'Comilla', division: 'Chattogram', center: [23.4607, 91.1809] },
    { name: 'Cox\'s Bazar', division: 'Chattogram', center: [21.4272, 92.0058] },
    { name: 'Feni', division: 'Chattogram', center: [23.0159, 91.3976] },
    { name: 'Khagrachhari', division: 'Chattogram', center: [23.1193, 91.9847] },
    { name: 'Lakshmipur', division: 'Chattogram', center: [22.9426, 90.8282] },
    { name: 'Noakhali', division: 'Chattogram', center: [22.8696, 91.0995] },
    { name: 'Rangamati', division: 'Chattogram', center: [22.6533, 92.1728] },

    // Khulna Division
    { name: 'Khulna', division: 'Khulna', center: [22.8456, 89.5403] },
    { name: 'Bagerhat', division: 'Khulna', center: [22.6602, 89.7895] },
    { name: 'Chuadanga', division: 'Khulna', center: [23.6402, 88.8410] },
    { name: 'Jashore', division: 'Khulna', center: [23.1667, 89.2167] },
    { name: 'Jhenaidah', division: 'Khulna', center: [23.5448, 89.1539] },
    { name: 'Kushtia', division: 'Khulna', center: [23.9013, 89.1206] },
    { name: 'Magura', division: 'Khulna', center: [23.4855, 89.4198] },
    { name: 'Meherpur', division: 'Khulna', center: [23.7622, 88.6318] },
    { name: 'Narail', division: 'Khulna', center: [23.1725, 89.5126] },
    { name: 'Satkhira', division: 'Khulna', center: [22.7185, 89.0705] },

    // Rajshahi Division
    { name: 'Rajshahi', division: 'Rajshahi', center: [24.3745, 88.6042] },
    { name: 'Bogura', division: 'Rajshahi', center: [24.8465, 89.3773] },
    { name: 'Joypurhat', division: 'Rajshahi', center: [25.0968, 89.0227] },
    { name: 'Naogaon', division: 'Rajshahi', center: [24.7936, 88.9318] },
    { name: 'Natore', division: 'Rajshahi', center: [24.4206, 89.0000] },
    { name: 'Chapainawabganj', division: 'Rajshahi', center: [24.5965, 88.2775] },
    { name: 'Pabna', division: 'Rajshahi', center: [24.0064, 89.2372] },
    { name: 'Sirajganj', division: 'Rajshahi', center: [24.4534, 89.7006] },

    // Barishal Division
    { name: 'Barishal', division: 'Barishal', center: [22.7010, 90.3535] },
    { name: 'Barguna', division: 'Barishal', center: [22.0953, 90.1121] },
    { name: 'Bhola', division: 'Barishal', center: [22.6859, 90.6482] },
    { name: 'Jhalokati', division: 'Barishal', center: [22.6406, 90.1987] },
    { name: 'Patuakhali', division: 'Barishal', center: [22.3596, 90.3298] },
    { name: 'Pirojpur', division: 'Barishal', center: [22.5841, 89.9720] },

    // Sylhet Division
    { name: 'Sylhet', division: 'Sylhet', center: [24.8949, 91.8687] },
    { name: 'Habiganj', division: 'Sylhet', center: [24.3745, 91.4155] },
    { name: 'Moulvibazar', division: 'Sylhet', center: [24.4829, 91.7774] },
    { name: 'Sunamganj', division: 'Sylhet', center: [25.0658, 91.3950] },

    // Rangpur Division
    { name: 'Rangpur', division: 'Rangpur', center: [25.7439, 89.2752] },
    { name: 'Dinajpur', division: 'Rangpur', center: [25.6217, 88.6354] },
    { name: 'Gaibandha', division: 'Rangpur', center: [25.3288, 89.5285] },
    { name: 'Kurigram', division: 'Rangpur', center: [25.8054, 89.6362] },
    { name: 'Lalmonirhat', division: 'Rangpur', center: [25.9923, 89.2847] },
    { name: 'Nilphamari', division: 'Rangpur', center: [25.9317, 88.8560] },
    { name: 'Panchagarh', division: 'Rangpur', center: [26.3411, 88.5542] },
    { name: 'Thakurgaon', division: 'Rangpur', center: [26.0336, 88.4616] },

    // Mymensingh Division
    { name: 'Mymensingh', division: 'Mymensingh', center: [24.7471, 90.4203] },
    { name: 'Jamalpur', division: 'Mymensingh', center: [24.9375, 89.9370] },
    { name: 'Netrokona', division: 'Mymensingh', center: [24.8703, 90.7276] },
    { name: 'Sherpur', division: 'Mymensingh', center: [25.0204, 90.0153] },
];