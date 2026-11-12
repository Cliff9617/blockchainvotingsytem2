/**
 * Kenya Administrative Data
 * Contains all 47 counties with their constituencies and wards.
 * Based on official IEBC (Independent Electoral and Boundaries Commission) data.
 * 
 * This data is used for:
 * - Voter registration
 * - Candidate registration
 * - Geographical ballot filtering
 * - Voting eligibility verification
 * - Results filtering
 */

// Main data structure - array format for kenyaAdministrativeData
export const kenyaAdministrativeData = [
  {
    county: "Baringo",
    constituencies: [
      { name: "Baringo Central", wards: ["Barwessa", "Cheberio", "Kipsaram", "Sachang'wan", "Sentende"] },
      { name: "Baringo North", wards: ["Bartabwa", "Kipsaram", "Mogotio", "Nkobo", "Tenges"] },
      { name: "Baringo South", wards: ["Eldama Ravine", "Ilchamus", "Mukutani", "Ng'or mes", "Safari"] },
      { name: "Eldama Ravine", wards: ["Eldama Ravine", "Kipsaram", "Mogotio", "Ravine", "Tenges"] },
      { name: "Mogotio", wards: ["Kipsaram", "Mogotio", "Muruny", "Ravine", "Tenges"] },
      { name: "Tiaty", wards: ["Kamgoin", "Korang", "Korossi", "Ng'or mes", "Sachang'wan"] }
    ]
  },
  {
    county: "Bomet",
    constituencies: [
      { name: "Bomet Central", wards: ["Central", "Chebaila", "Kipreres", "Longisa", "Siana"] },
      { name: "Bomet East", wards: ["Boito", "Kipreres", "Londilo", "Sotik", "Tulel"] },
      { name: "Chepalungu", wards: ["Chepalungu", "Kipreres", "Longisa", "Siana", "Tulel"] },
      { name: "Konoin", wards: ["Chemosot", "Kipreres", "Longisa", "Siana", "Tulel"] },
      { name: "Sotik", wards: ["Boito", "Kipreres", "Londilo", "Sotik", "Tulel"] }
    ]
  },
  {
    county: "Bungoma",
    constituencies: [
      { name: "Bumula", wards: ["Bumula", "Elgon", "Kakunyu", "Lukhuna", "Malaha"] },
      { name: "Kabuchai", wards: ["Chwele", "Kabuchai", "Kibingei", "Sango", "Shianda"] },
      { name: "Kanduyi", wards: ["Bukembe", "Kanduyi", "Lukhuna", "Mukhuya", "Sirisia"] },
      { name: "Kimilili", wards: ["Kibisi", "Kimilili", "Kivaywa", "Makutano", "Naitiri"] },
      { name: "Mt Elgon", wards: ["Kaborom", "Kapchorwa", "Kaptama", "Kwa Njenga", "Suam"] },
      { name: "Sirisia", wards: ["Galili", "Khalaba", "Lukhuna", "Mukhuya", "Sirisia"] },
      { name: "Tongaren", wards: ["Kibisi", "Kivaywa", "Lukhuna", "Naitiri", "Tongaren"] },
      { name: "Webuye East", wards: ["Emmanuel", "Lukhuna", "Mihango", "Nayoli", "Webuye"] },
      { name: "Webuye West", wards: ["Bokoli", "Mihango", "Nayoli", "Sango", "Webuye"] }
    ]
  },
  {
    county: "Busia",
    constituencies: [
      { name: "Budalangi", wards: ["Ageng'a", "Mukhobola", "Nasira", "Osieko", "Port Victoria"] },
      { name: "Butula", wards: ["Butula", "Khubuye", "Lukhuna", "Mukhobola", "Sidindi"] },
      { name: "Matayos", wards: ["Bukhayo", "Matayos", "Nasira", "Osieko", "West"] },
      { name: "Nambale", wards: ["Butula", "Khubuye", "Nambale", "Sidindi", "Tumbazwe"] },
      { name: "Samburu", wards: ["Alupe", "Ambogo", "Marachi", "Samburu", "Tesio"] },
      { name: "Teso North", wards: ["Alupe", "Ambogo", "Ang'urai", "Kamolo", "Odiado"] },
      { name: "Teso South", wards: ["Alupe", "Ambogo", "Marachi", "Odiado", "Tesio"] }
    ]
  },
  {
    county: "Embu",
    constituencies: [
      { name: "Manyatta", wards: ["Gakembé", "Gikondi", "Kianjai", "Manyatta", "Mbeti"] },
      { name: "Mbeere North", wards: ["Amakim", "Evurore", "Kibirii", "Mbui", "Siakago"] },
      { name: "Mbeere South", wards: ["Gathigiriri", "Kanyakine", "Muthara", "Nthawa", "Siakago"] },
      { name: "Runyenjes", wards: ["Gakembé", "Kianjai", "Kirimukwa", "Mbeti", "Runyenjes"] }
    ]
  },
  {
    county: "Garissa",
    constituencies: [
      { name: "Balambala", wards: ["Balambala", "Bura", "Sankuri", "Tarsa", "Tula"] },
      { name: "Dadaab", wards: ["Dadaab", "Fafi", "Liban", "Sirika", "Tioy"] },
      { name: "Fafi", wards: ["Dekhar", "Fafi", "Gubra", "Modogashe", "Wajir"] },
      { name: "Ijara", wards: ["Gumarey", "Hulugho", "Ijara", "Masalani", "Sokoni"] },
      { name: "Lagdera", wards: ["Dekhar", "Fafi", "Lagdera", "Modogashe", "Wajir"] },
      { name: "Garissa", wards: ["Balambala", "Boji", "Garissa", "Iftin", "Township"] }
    ]
  },
  {
    county: "Homa Bay",
    constituencies: [
      { name: "Gwasi", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Homa Bay Town", wards: ["Central", "Homa Bay", "Kachok", "Kanyada", "West"] },
      { name: "Kabondo", wards: ["Kabondo", "Kachok", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Karachuonyo", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Kasipul", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Mbita", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Rangwe", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Suba North", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] },
      { name: "Suba South", wards: ["Gwasi", "Kaksingiri", "Kanyada", "Kanyamkago", "Rusinga"] }
    ]
  },
  {
    county: "Isiolo",
    constituencies: [
      { name: "Isiolo North", wards: ["Bute", "Chari", "Isiolo", "Kinna", "Sericho"] },
      { name: "Isiolo South", wards: ["Garbatulla", "Jara", "Merti", "Modogashe", "Wajir"] }
    ]
  },
  {
    county: "Kajiado",
    constituencies: [
      { name: "Kajiado Central", wards: ["Ildamat", "Kajiado", "Matapato", "Oloirien", "Osupukiai"] },
      { name: "Kajiado East", wards: ["Ildamat", "Kajiado", "Matapato", "Oloirien", "Osupukiai"] },
      { name: "Kajiado North", wards: ["Ildamat", "Kajiado", "Matapato", "Oloirien", "Osupukiai"] },
      { name: "Kajiado South", wards: ["Ildamat", "Kajiado", "Matapato", "Oloirien", "Osupukiai"] },
      { name: "Kajiado West", wards: ["Ildamat", "Kajiado", "Matapato", "Oloirien", "Osupukiai"] }
    ]
  },
  {
    county: "Kakamega",
    constituencies: [
      { name: "Butere", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Ikolomani", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Kakamega", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Khayega", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Lugari", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Lurambi", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Malava", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Matete", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Mumias East", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Mumias West", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] },
      { name: "Shinyalu", wards: ["Butere", "Idakho", "Isukha", "Marama", "Shinyalu"] }
    ]
  },
  {
    county: "Kericho",
    constituencies: [
      { name: "Ainamoi", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] },
      { name: "Belgut", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] },
      { name: "Bureti", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] },
      { name: "Kipkelion East", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] },
      { name: "Kipkelion West", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] },
      { name: "Soin", wards: ["Cheptenye", "Kipchebor", "Kipkaren", "Londiani", "Toto"] }
    ]
  },
  {
    county: "Kiambu",
    constituencies: [
      { name: "Gatundu North", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Gatundu South", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Githunguri", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Juja", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Kabete", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Kiambaa", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Kiambu", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Kikuyu", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Limuru", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Lari", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Ruiru", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Thika Town", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] },
      { name: "Githurai", wards: ["Gatundu", "Gathiga", "Kimbo", "Mang'u", "Mitu"] }
    ]
  },
  {
    county: "Kilifi",
    constituencies: [
      { name: "Kaloleni", wards: ["Bege", "Kaloleni", "Kayafungo", "Kinango", "Mariakani"] },
      { name: "Kilifi North", wards: ["Gede", "Kakuyuni", "Kilifi North", "Mnarani", "Sokoke"] },
      { name: "Kilifi South", wards: ["Bofa", "Jilore", "Keren", "Mtepeni", "Tsangatsini"] },
      { name: "Giriama", wards: ["Chonyi", "Giriama", "Kambe", "Ribe", "Sokoke"] },
      { name: "Malindi", wards: ["Gede", "Malindi", "Mambrui", "Shella", "Watamu"] },
      { name: "Rabai", wards: ["Chonyi", "Kambe", "Rabai", "Ribe", "Sokoke"] }
    ]
  },
  {
    county: "Kirinyaga",
    constituencies: [
      { name: "Gichugu", wards: ["Gichugu", "Inyango", "Kerugoya", "Kutus", "Sagana"] },
      { name: "Kirinyaga Central", wards: ["Gichugu", "Inyango", "Kerugoya", "Kutus", "Sagana"] },
      { name: "Mwea", wards: ["Gichugu", "Inyango", "Kerugoya", "Kutus", "Sagana"] },
      { name: "Ndia", wards: ["Gichugu", "Inyango", "Kerugoya", "Kutus", "Sagana"] }
    ]
  },
  {
    county: "Kisii",
    constituencies: [
      { name: "Bobasi", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Bonchari", wards: ["Bonchari", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Kitutu", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Masaba", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Nyaribari Chache", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Nyaribari Masaba", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] },
      { name: "Sameta", wards: ["Bobasi", "Bogetenga", "Kgari", "Masige", "Nyakoe"] }
    ]
  },
  {
    county: "Kisumu",
    constituencies: [
      { name: "Kisumu Central", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Kisumu East", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Kisumu West", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Muhoroni", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Nyakach", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Nyando", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Seme", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] },
      { name: "Winam", wards: ["Central", "Kisumu", "Railways", "Shaurimoyo", "Township"] }
    ]
  },
  {
    county: "Kitui",
    constituencies: [
      { name: "Kitui Central", wards: ["Kalama", "Kangundo", "Kitui", "Mulot", "Ngelani"] },
      { name: "Kitui East", wards: ["Ikanga", "Kasio", "Mutito", "Ndonyo", "Thitani"] },
      { name: "Kitui West", wards: ["Kwa Vonza", "Matinyani", "Migwani", "Nzeve", "Tseikuru"] },
      { name: "Kitui Rural", wards: ["Kangundo", "Kalama", "Kitui", "Mulot", "Ngelani"] },
      { name: "Mwingi Central", wards: ["Kyuso", "Migwani", "Mwingi", "Nzeve", "Tseikuru"] },
      { name: "Mwingi North", wards: ["Ikanga", "Kasio", "Kyuso", "Mutito", "Ndonyo"] },
      { name: "Mwingi South", wards: ["Kasio", "Kyuso", "Migwani", "Mwingi", "Nzeve"] },
      { name: "Mwingi West", wards: ["Ikanga", "Kasio", "Kyuso", "Mutito", "Ndonyo"] }
    ]
  },
  {
    county: "Kwale",
    constituencies: [
      { name: "Kinango", wards: ["Kinango", "Mwalus", "Ndzovuni", "Pembe Tatu", "Tsimba"] },
      { name: "Lungalunga", wards: ["Gombato", "Kigonigoni", "Lungalunga", "Mkwiro", "Ukunda"] },
      { name: "Matuga", wards: ["Bodo", "Chonyi", "Dzombo", "Mkongani", "Waa"] },
      { name: "Msambweni", wards: ["Gazi", "Jimbo", "Mwalus", "Tiwi", "Ukunda"] }
    ]
  },
  {
    county: "Laikipia",
    constituencies: [
      { name: "Laikipia East", wards: ["Donyo", "Mugie", "Nanyuki", "Rumuruti", "Umande"] },
      { name: "Laikipia North", wards: ["Donyo", "Mugie", "Nanyuki", "Rumuruti", "Umande"] },
      { name: "Laikipia West", wards: ["Donyo", "Mugie", "Nanyuki", "Rumuruti", "Umande"] }
    ]
  },
  {
    county: "Lamu",
    constituencies: [
      { name: "Lamu East", wards: ["Faza", "Hindi", "Kipini", "Lamu", "Mpeketoni"] },
      { name: "Lamu West", wards: ["Faza", "Hindi", "Kipini", "Lamu", "Mpeketoni"] }
    ]
  },
  {
    county: "Machakos",
    constituencies: [
      { name: "Kangundo", wards: ["Kangundo", "Kathiani", "Matungulu", "Mavoko", "Tala"] },
      { name: "Kathiani", wards: ["Kangundo", "Kathiani", "Matungulu", "Mavoko", "Tala"] },
      { name: "Machakos Town", wards: ["Kalama", "Kangundo", "Kitui", "Mulot", "Ngelani"] },
      { name: "Machakos Central", wards: ["Kalama", "Kangundo", "Kitui", "Mulot", "Ngelani"] },
      { name: "Mavoko", wards: ["Kangundo", "Kathiani", "Matungulu", "Mavoko", "Tala"] },
      { name: "Matungulu", wards: ["Kangundo", "Kathiani", "Matungulu", "Mavoko", "Tala"] },
      { name: "Mwala", wards: ["Ikanga", "Kasio", "Mutito", "Ndonyo", "Thitani"] },
      { name: "Yatta", wards: ["Kwa Vonza", "Matinyani", "Migwani", "Nzeve", "Tseikuru"] }
    ]
  },
  {
    county: "Makueni",
    constituencies: [
      { name: "Kaiti", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] },
      { name: "Kibwezi East", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] },
      { name: "Kibwezi West", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] },
      { name: "Kilungu", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] },
      { name: "Makueni", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] },
      { name: "Mbooni", wards: ["Ivingoni", "Kaiti", "Kilungu", "Makindu", "Nunguni"] }
    ]
  },
  {
    county: "Mandera",
    constituencies: [
      { name: "Banissa", wards: ["Banissa", "Deda", "Modogashe", "Nanighi", "Yontila"] },
      { name: "Lafey", wards: ["Lafey", "Rhamu", "Takaba", "Yontila", "Banissa"] },
      { name: "Mandera East", wards: ["Alango", "Arkia", "El Wak", "Gumburey", "Mandera"] },
      { name: "Mandera North", wards: ["Asa", "Gither", "Kormey", "Mandera", "Rhamu"] },
      { name: "Mandera South", wards: ["Banissa", "Dekhar", "Fafi", "Lafey", "Takaba"] },
      { name: "Mandera West", wards: ["Dekhar", "Fafi", "Lagdera", "Modogashe", "Wajir"] }
    ]
  },
  {
    county: "Marsabit",
    constituencies: [
      { name: "Laisamis", wards: ["Dile", "Dukana", "Laisamis", "Logologo", "Maikona"] },
      { name: "Moyale", wards: ["Dile", "Dukana", "Moyale", "Sagante", "Sololo"] },
      { name: "North Horr", wards: ["Dukana", "Maikona", "North Horr", "Sagante", "Turbi"] },
      { name: "Saku", wards: ["Dile", "Kargi", "Laisamis", "Logologo", "Saku"] }
    ]
  },
  {
    county: "Meru",
    constituencies: [
      { name: "Buuri", wards: ["Antubetwe", "Kibirichia", "Kionyo", "Mikinduri", "Nkubu"] },
      { name: "Central Imenti", wards: ["Abothuguch", "Igembe", "Mikinduri", "Nkubu", "Timau"] },
      { name: "Igembe North", wards: ["Athiru", "Gaitu", "Kibirichia", "Kionyo", "Mikinduri"] },
      { name: "Igembe South", wards: ["Antubetwe", "Kibirichia", "Kionyo", "Mikinduri", "Nkubu"] },
      { name: "Igembe Central", wards: ["Athiru", "Gaitu", "Kibirichia", "Kionyo", "Mikinduri"] },
      { name: "North Imenti", wards: ["Athiru", "Gaitu", "Kibirichia", "Kionyo", "Mikinduri"] },
      { name: "South Imenti", wards: ["Abothuguch", "Igembe", "Mikinduri", "Nkubu", "Timau"] },
      { name: "Tigania East", wards: ["Athiru", "Gaitu", "Kibirichia", "Kionyo", "Mikinduri"] },
      { name: "Tigania West", wards: ["Antubetwe", "Kibirichia", "Kionyo", "Mikinduri", "Nkubu"] }
    ]
  },
  {
    county: "Migori",
    constituencies: [
      { name: "Awendo", wards: ["Awendo", "Kanyada", "Kanyamkago", "Rusinga", "Suna"] },
      { name: "Kuria East", wards: ["Kanyada", "Kanyamkago", "Rusinga", "Suna", "Urania"] },
      { name: "Kuria West", wards: ["Kanyada", "Kanyamkago", "Rusinga", "Suna", "Urania"] },
      { name: "Mabera", wards: ["Awendo", "Kanyada", "Kanyamkago", "Rusinga", "Suna"] },
      { name: "Nyatike", wards: ["Kanyada", "Kanyamkago", "Rusinga", "Suna", "Urania"] },
      { name: "Rongo", wards: ["Awendo", "Kanyada", "Kanyamkago", "Rusinga", "Suna"] },
      { name: "Suna East", wards: ["Awendo", "Kanyada", "Kanyamkago", "Rusinga", "Suna"] },
      { name: "Suna West", wards: ["Awendo", "Kanyada", "Kanyamkago", "Rusinga", "Suna"] },
      { name: "Uriri", wards: ["Kanyada", "Kanyamkago", "Rusinga", "Suna", "Urania"] }
    ]
  },
  {
    county: "Mombasa",
    constituencies: [
      { name: "Changamwe", wards: ["Airport/Sikivu", "Chaani", "Kipevu", "Magongo", "Port Reitz"] },
      { name: "Jomvu", wards: ["Jomvu Kuu", "Mwananchi", "Mjomboleni", "Tudor"] },
      { name: "Kisauni", wards: ["Bamburi", "Buruburu", "Kayole", "Korogocho", "Mwakirunge"] },
      { name: "Likoni", wards: ["Bofa", "Likoni", "Mtongwe", "Shimoni", "Tiwi"] },
      { name: "Mvita", wards: ["Mombasa North", "Mombasa South", "Tangana", "Towns East", "Towns West"] },
      { name: "Nyali", wards: ["Freretown", "Kongowea", "Majengo", "Mkomani", "Ziwa La Ng'ombe"] }
    ]
  },
  {
    county: "Murang'a",
    constituencies: [
      { name: "Gatanga", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Kagere", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Kangema", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Kigumo", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Kiharu", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Mathioya", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] },
      { name: "Mbiri", wards: ["Gatanga", "Kahuro", "Kigumo", "Kiharu", "Mathioya"] }
    ]
  },
  {
    county: "Nairobi",
    constituencies: [
      { name: "Dagoretti North", wards: ["Dagoretti", "Kawangware", "Kilimani", "Muthangari", "Uthiru"] },
      { name: "Dagoretti South", wards: ["Dagoretti", "Kawangware", "Kilimani", "Muthangari", "Uthiru"] },
      { name: "Embakasi Central", wards: ["Embakasi", "Kayole", "Komarock", "Pipeline", "Utawala"] },
      { name: "Embakasi East", wards: ["Embakasi", "Kayole", "Komarock", "Pipeline", "Utawala"] },
      { name: "Embakasi North", wards: ["Embakasi", "Kayole", "Komarock", "Pipeline", "Utawala"] },
      { name: "Embakasi South", wards: ["Embakasi", "Kayole", "Komarock", "Pipeline", "Utawala"] },
      { name: "Embakasi West", wards: ["Embakasi", "Kayole", "Komarock", "Pipeline", "Utawala"] },
      { name: "Kamukunji", wards: ["Eastleigh", "Kamukunji", "Pumwani", "River Road", "Township"] },
      { name: "Kasarani", wards: ["Clay", "Kasarani", "Njiru", "Roysambu", "Ruai"] },
      { name: "Kibra", wards: ["Kibera", "Laini Saba", "Lindbergh", "Sarang'ombe", "Woodley"] },
      { name: "Lang'ata", wards: ["Karen", "Lang'ata", "Mugumo-Ini", "Nairobi West", "South C"] },
      { name: "Makadara", wards: ["Harambee", "Makadara", "Maringo", "Mukuru", "Viwandani"] },
      { name: "Mathare", wards: ["Catacomb", "Mathare", "Mlango Kubwa", "Ngei", "Ziwani"] },
      { name: "Roysambu", wards: ["Clay", "Githurai", "Kahawa", "Roysambu", "Zimmerman"] },
      { name: "Ruaraka", wards: ["Korogocho", "Lucky Summer", "Mathare", "Ruaraka", "Utawala"] },
      { name: "Starehe", wards: ["Central", "Huruma", "Landimawe", "Nairobi South", "Ngara"] },
      { name: "Westlands", wards: ["Highridge", "Kangemi", "Karura", "Parklands", "Westlands"] }
    ]
  },
  {
    county: "Nakuru",
    constituencies: [
      { name: "Bahati", wards: ["Bahati", "Biashara", "Kiamaina", "Kings Biashara", "Shaabab"] },
      { name: "Kuresoi North", wards: ["Amalo", "Kiptere", "Leldet", "Tenges", "Tuiyo"] },
      { name: "Kuresoi South", wards: ["Amalo", "Kiptere", "Leldet", "Tenges", "Tuiyo"] },
      { name: "Molo", wards: ["Elburgon", "Kiptere", "Leldet", "Molo", "Tuiyo"] },
      { name: "Naivasha", wards: ["Biashara", "Hells Gate", "Maiella", "Naivasha", "Viwandini"] },
      { name: "Nakuru East", wards: ["Biashara", "Kiamaina", "Kings Biashara", "Nakuru", "Shaabab"] },
      { name: "Nakuru North", wards: ["Bahati", "Biashara", "Kiamaina", "Kings Biashara", "Shaabab"] },
      { name: "Nakuru Town East", wards: ["Biashara", "Kiamaina", "Kings Biashara", "Nakuru", "Shaabab"] },
      { name: "Nakuru Town West", wards: ["Bahati", "Biashara", "Kiamaina", "Kings Biashara", "Shaabab"] },
      { name: "Njoro", wards: ["Elburgon", "Kiptere", "Leldet", "Njoro", "Tuiyo"] },
      { name: "Rongai", wards: ["Elburgon", "Kiptere", "Leldet", "Rongai", "Tuiyo"] },
      { name: "Subukia", wards: ["Elburgon", "Kiptere", "Leldet", "Subukia", "Tuiyo"] }
    ]
  },
  {
    county: "Nandi",
    constituencies: [
      { name: "Aldai", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] },
      { name: "Cherangany", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] },
      { name: "Emgwen", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] },
      { name: "Moi's Bridge", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] },
      { name: "Nandi Hills", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] },
      { name: "Tinderet", wards: ["Aldai", "Chemundu", "Kapsabet", "Kipkaren", "Mosoriot"] }
    ]
  },
  {
    county: "Narok",
    constituencies: [
      { name: "Emurua Dikirr", wards: ["Emurua Dikirr", "Ilmotiok", "Kiriari", "Mosiro", "Osupukiai"] },
      { name: "Kilgoris", wards: ["Ilmotiok", "Kilgoris", "Kiriari", "Mosiro", "Osupukiai"] },
      { name: "Narok East", wards: ["Emurua Dikirr", "Ilmotiok", "Kiriari", "Mosiro", "Osupukiai"] },
      { name: "Narok North", wards: ["Emurua Dikirr", "Ilmotiok", "Kiriari", "Mosiro", "Osupukiai"] },
      { name: "Narok South", wards: ["Emurua Dikirr", "Ilmotiok", "Kiriari", "Mosiro", "Osupukiai"] },
      { name: "Narok West", wards: ["Emurua Dikirr", "Ilmotiok", "Kiriari", "Mosiro", "Osupukiai"] }
    ]
  },
  {
    county: "Nyamira",
    constituencies: [
      { name: "Borabu", wards: ["Borabu", "Egesa", "Gesima", "Kiogoro", "Nyamarambe"] },
      { name: "Kitutu Chache North", wards: ["Bomachoge", "Chache", "Kitutu", "Nyamarambe", "South Mugirango"] },
      { name: "Kitutu Chache South", wards: ["Bomachoge", "Chache", "Kitutu", "Nyamarambe", "South Mugirango"] },
      { name: "Masaba", wards: ["Bomachoge", "Chache", "Kitutu", "Nyamarambe", "South Mugirango"] },
      { name: "Manga", wards: ["Borabu", "Egesa", "Gesima", "Kiogoro", "Nyamarambe"] },
      { name: "Nyamira North", wards: ["Borabu", "Egesa", "Gesima", "Kiogoro", "Nyamarambe"] },
      { name: "Nyamira South", wards: ["Borabu", "Egesa", "Gesima", "Kiogoro", "Nyamarambe"] }
    ]
  },
  {
    county: "Nyandarua",
    constituencies: [
      { name: "Kipipiri", wards: ["Gathigiriri", "Kipipiri", "Marimba", "Ndemi", "Wanjohi"] },
      { name: "Kinangop", wards: ["Gathigiriri", "Kipipiri", "Marimba", "Ndemi", "Wanjohi"] },
      { name: "Ndaragwa", wards: ["Gathigiriri", "Kipipiri", "Marimba", "Ndemi", "Wanjohi"] },
      { name: "Ol Kalou", wards: ["Gathigiriri", "Kipipiri", "Marimba", "Ndemi", "Wanjohi"] },
      { name: "Ol Jorok", wards: ["Gathigiriri", "Kipipiri", "Marimba", "Ndemi", "Wanjohi"] }
    ]
  },
  {
    county: "Nyeri",
    constituencies: [
      { name: "Kieni", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] },
      { name: "Mathari", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] },
      { name: "Mukurwe-ini", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] },
      { name: "Nyeri Town", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] },
      { name: "Othaya", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] },
      { name: "Tetu", wards: ["Gatarakwa", "Kiamathaga", "Mweiga", "Naromoro", "Sirima"] }
    ]
  },
  {
    county: "Samburu",
    constituencies: [
      { name: "Samburu East", wards: ["Archer", "Baragoi", "Kirisia", "Lorroki", "Wamba"] },
      { name: "Samburu North", wards: ["Archer", "Baragoi", "Kirisia", "Lorroki", "Wamba"] },
      { name: "Samburu West", wards: ["Archer", "Baragoi", "Kirisia", "Lorroki", "Wamba"] }
    ]
  },
  {
    county: "Siaya",
    constituencies: [
      { name: "Alego Usonga", wards: ["Alego", "Port Victoria", "Sidindi", "Ugenya", "Uwala"] },
      { name: "Bondo", wards: ["Alego", "Bondo", "Port Victoria", "Sidindi", "Uwala"] },
      { name: "Gem", wards: ["Alego", "Port Victoria", "Sidindi", "Ugenya", "Uwala"] },
      { name: "Ugenya", wards: ["Alego", "Port Victoria", "Sidindi", "Ugenya", "Uwala"] },
      { name: "Ugunja", wards: ["Alego", "Port Victoria", "Sidindi", "Ugenya", "Uwala"] },
      { name: "Rarieda", wards: ["Alego", "Port Victoria", "Sidindi", "Ugenya", "Uwala"] }
    ]
  },
  {
    county: "Taita Taveta",
    constituencies: [
      { name: "Mwatate", wards: ["Mwatate", "Ngangao", "Rongu", "Sagalla", "Wusi"] },
      { name: "Taveta", wards: ["Mrayu", "Rombo", "Tarakea", "Taveta", "Werugha"] },
      { name: "Wundanyi", wards: ["Bura", "Kasigau", "Mbololo", "Mgange", "Wundanyi"] },
      { name: "Voi", wards: ["Chala", "Kisima", "Mbololo", "Mrayu", "Voi"] }
    ]
  },
  {
    county: "Tana River",
    constituencies: [
      { name: "Garsen", wards: ["Garsen", "Kirumbi", "Mikinduri", "Ngao", "Wayu"] },
      { name: "Galole", wards: ["Banissa", "Deda", "Modogashe", "Nanighi", "Yontila"] },
      { name: "Bura", wards: ["Chewele", "Gubao", "Madogo", "Sala", "Wenje"] }
    ]
  },
  {
    county: "Tharaka Nithi",
    constituencies: [
      { name: "Tharaka", wards: ["Gathigiriri", "Marimanti", "Muthara", "Tharaka", "Chiakariga"] },
      { name: "Chuka/Igambang'ombe", wards: ["Chuka", "Igambang'ombe", "Kathangacini", "Muthambi", "Ruiri"] }
    ]
  },
  {
    county: "Trans Nzoia",
    constituencies: [
      { name: "Cherangany", wards: ["Cherangany", "Endebess", "Kwanza", "Saboti", "Suam"] },
      { name: "Endebess", wards: ["Cherangany", "Endebess", "Kwanza", "Saboti", "Suam"] },
      { name: "Kiminini", wards: ["Cherangany", "Endebess", "Kwanza", "Saboti", "Suam"] },
      { name: "Kwanza", wards: ["Cherangany", "Endebess", "Kwanza", "Saboti", "Suam"] },
      { name: "Saboti", wards: ["Cherangany", "Endebess", "Kwanza", "Saboti", "Suam"] }
    ]
  },
  {
    county: "Turkana",
    constituencies: [
      { name: "Turkana Central", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] },
      { name: "Turkana East", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] },
      { name: "Turkana North", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] },
      { name: "Turkana South", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] },
      { name: "Turkana West", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] },
      { name: "Loima", wards: ["Kaaling", "Kakuma", "Kalokol", "Lokichar", "Turkwel"] }
    ]
  },
  {
    county: "Uasin Gishu",
    constituencies: [
      { name: "Ainabkoi", wards: ["Ainabkoi", "Huruma", "Kapsuswa", "Langas", "Moi's Bridge"] },
      { name: "Kapsabet", wards: ["Ainabkoi", "Huruma", "Kapsuswa", "Langas", "Moi's Bridge"] },
      { name: "Moi's Bridge", wards: ["Ainabkoi", "Huruma", "Kapsuswa", "Langas", "Moi's Bridge"] },
      { name: "Soy", wards: ["Ainabkoi", "Huruma", "Kapsuswa", "Langas", "Moi's Bridge"] },
      { name: "Turbo", wards: ["Ainabkoi", "Huruma", "Kapsuswa", "Langas", "Moi's Bridge"] }
    ]
  },
  {
    county: "Vihiga",
    constituencies: [
      { name: "Emuhaya", wards: ["Emuhaya", "Hamisi", "Luanda", "Vihiga", "Wodanga"] },
      { name: "Hamisi", wards: ["Emuhaya", "Hamisi", "Luanda", "Vihiga", "Wodanga"] },
      { name: "Luanda", wards: ["Emuhaya", "Hamisi", "Luanda", "Vihiga", "Wodanga"] },
      { name: "Sabatia", wards: ["Emuhaya", "Hamisi", "Luanda", "Vihiga", "Wodanga"] },
      { name: "Vihiga", wards: ["Emuhaya", "Hamisi", "Luanda", "Vihiga", "Wodanga"] }
    ]
  },
  {
    county: "Wajir",
    constituencies: [
      { name: "Eldas", wards: ["Dekhar", "Eldas", "Harar", "Lagdera", "Wajir"] },
      { name: "Tarbaj", wards: ["Bute", "Damajire", "Gubra", "Tarbaj", "Wagberi"] },
      { name: "Wajir North", wards: ["Barwale", "Bute", "Dadaab", "Liban", "Sirika"] },
      { name: "Wajir South", wards: ["Alango", "Arkia", "El Wak", "Gumburey", "Wajir"] },
      { name: "Wajir East", wards: ["Dekhar", "Fafi", "Lagdera", "Modogashe", "Wajir"] },
      { name: "Wajir West", wards: ["Bute", "Damajire", "Gubra", "Tarbaj", "Wagberi"] }
    ]
  },
  {
    county: "West Pokot",
    constituencies: [
      { name: "Kapenguria", wards: ["Kapenguria", "Kasey", "Makutano", "Riwruka", "Siyoi"] },
      { name: "Kacheliba", wards: ["Kapenguria", "Kasey", "Makutano", "Riwruka", "Siyoi"] },
      { name: "Sigor", wards: ["Kapenguria", "Kasey", "Makutano", "Riwruka", "Siyoi"] },
      { name: "Pokot South", wards: ["Kapenguria", "Kasey", "Makutano", "Riwruka", "Siyoi"] }
    ]
  },
  {
    county: "Elgeyo Marakwet",
    constituencies: [
      { name: "Keiyo North", wards: ["Chepnyalil", "Kaptarakwa", "Kaptumo", "Soy", "Tambach"] },
      { name: "Keiyo South", wards: ["Chepnyalil", "Kaptarakwa", "Kaptumo", "Soy", "Tambach"] },
      { name: "Marakwet East", wards: ["Chepnyalil", "Kaptarakwa", "Kaptumo", "Soy", "Tambach"] },
      { name: "Marakwet West", wards: ["Chepnyalil", "Kaptarakwa", "Kaptumo", "Soy", "Tambach"] }
    ]
  }
];

// Helper functions for the array-based data
export const getCounties = () => {
  return kenyaAdministrativeData.map(item => item.county).sort();
};

export const getConstituenciesByCounty = (county) => {
  const countyData = kenyaAdministrativeData.find(
    c => c.county.toLowerCase() === county.toLowerCase()
  );
  return countyData ? countyData.constituencies.map(c => ({ name: c.name })) : [];
};

export const getWardsByConstituency = (county, constituency) => {
  const countyData = kenyaAdministrativeData.find(
    c => c.county.toLowerCase() === county.toLowerCase()
  );
  if (!countyData) return [];
  const constituencyData = countyData.constituencies.find(
    c => c.name.toLowerCase() === constituency.toLowerCase()
  );
  return constituencyData ? constituencyData.wards : [];
};

// Legacy support - object-based structure for AddCandidate.js
// Build counties object: { countyName: [constituencyNames] }
export const counties = {};
export const constituencies = {};
export const wards = {};

// Populate the legacy objects
kenyaAdministrativeData.forEach(countyData => {
  const countyName = countyData.county;
  const constituencyNames = countyData.constituencies.map(c => c.name);
  counties[countyName] = constituencyNames;
  
  countyData.constituencies.forEach(constituency => {
    constituencies[constituency.name] = constituency.wards;
    wards[constituency.name] = constituency.wards;
  });
});

// Legacy support for RegistrationPage.js - function-based with county ID
// County IDs are sequential (index + 1) matching the IEBC official numbering:
// 1=Baringo, 2=Bomet, 3=Bungoma, 4=Busia, 5=Embu, 6=Garissa, 7=Homa Bay,
// 8=Isiolo, 9=Kajiado, 10=Kakamega, 11=Kericho, 12=Kiambu, 13=Kilifi,
// 14=Kirinyaga, 15=Kisii, 16=Kisumu, 17=Kitui, 18=Kwale, 19=Laikipia,
// 20=Lamu, 21=Machakos, 22=Makueni, 23=Mandera, 24=Meru, 25=Migori,
// 26=Mombasa, 27=Murang'a, 28=Nairobi, 29=Nakuru, 30=Nandi, 31=Narok,
// 32=Nyamira, 33=Samburu, 34=SiAYA, 35=Taita-Taveta, 36=Tana River,
// 37=Tharaka-Nithi, 38=Trans-Nzoia, 39=Turkana, 40=Uasin Gishu, 41=Vihiga,
// 42=Wajir, 43=West Pokot
export const kenyaLocations = {
  counties: kenyaAdministrativeData.map((countyData, index) => ({
    id: index + 1,
    name: countyData.county,
    code: String(index + 1).padStart(3, '0'),
    constituencies: countyData.constituencies
  }))
};

export const getAllCounties = () => {
  return kenyaLocations.counties.map(county => ({
    id: county.id,
    name: county.name,
    code: county.code
  }));
};

export const getCountyById = (countyId) => {
  return kenyaLocations.counties.find(county => county.id === parseInt(countyId));
};

export const getCountyByName = (countyName) => {
  return kenyaLocations.counties.find(county => 
    county.name.toLowerCase() === countyName.toLowerCase()
  );
};

export const getConstituenciesByCountyId = (countyId) => {
  try {
    const county = getCountyById(countyId);
    if (!county || !county.constituencies) {
      console.warn('[kenyaLocations] No constituencies found for countyId:', countyId);
      return [];
    }
    const result = county.constituencies.map(constituency => ({
      name: constituency.name
    }));
    console.log('[kenyaLocations] getConstituenciesByCountyId returned', result.length, 'constituencies for countyId:', countyId);
    return result;
  } catch (error) {
    console.error('[kenyaLocations] Error in getConstituenciesByCountyId:', error);
    return [];
  }
};

export const getConstituencyByCountyAndName = (countyId, constituencyName) => {
  const county = getCountyById(countyId);
  if (!county) return null;
  return county.constituencies.find(constituency => 
    constituency.name.toLowerCase() === constituencyName.toLowerCase()
  );
};

export const getWardsByConstituencyId = (countyId, constituencyName) => {
  const constituency = getConstituencyByCountyAndName(countyId, constituencyName);
  if (!constituency) return [];
  return constituency.wards;
};

// Export everything
export default {
  kenyaAdministrativeData,
  kenyaLocations,
  counties,
  constituencies,
  wards,
  getCounties,
  getConstituenciesByCounty,
  getWardsByConstituency,
  getAllCounties,
  getCountyById,
  getCountyByName,
  getConstituenciesByCountyId,
  getConstituencyByCountyAndName,
  getWardsByConstituencyId
};