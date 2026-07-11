import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Seeding profiles...');
  const profileId1 = 'mock-user-1';
  const profileId2 = 'mock-user-2';

  await setDoc(doc(db, 'profiles', profileId1), {
    display_name: 'Srini Master',
    halton_town: 'Milton',
    availability: 'online',
    is_admin: true
  });

  await setDoc(doc(db, 'profiles', profileId2), {
    display_name: 'Telugu Plumber',
    halton_town: 'Oakville',
    availability: 'offline'
  });

  console.log('Seeding tradespeople...');
  await addDoc(collection(db, 'tradespeople'), {
    profile_id: profileId2,
    company_name: 'Sri Venkateswara Plumbing',
    short_description: 'Expert plumbing for your home. Telugu spoken.',
    category: 'Plumbing',
    speaks_telugu: true,
    emergency_24_7: true,
    community_vouched: true,
    avg_rating: 4.8,
    is_active: true
  });

  console.log('Seeding venues...');
  await addDoc(collection(db, 'venues'), {
    name: 'Milton Community Hall',
    description: 'Spacious hall perfect for cultural events and gatherings.',
    city: 'Milton',
    venue_type: 'Hall',
    dedicated_veg_kitchen: true,
    external_catering_allowed: true,
    alcohol_allowed: false,
    max_capacity: 150,
    avg_rating: 4.5,
    is_active: true,
    admin_verified: true
  });

  console.log('Seeding childcare providers...');
  await addDoc(collection(db, 'childcare_providers'), {
    profile_id: profileId1,
    provider_type: 'Home Daycare',
    vsc_verified: true,
    pure_vegetarian: true,
    peanut_free: true,
    cpr_certified: true,
    emergency_available: false,
    avg_rating: 5.0,
    is_active: true,
    years_experience: 10
  });

  console.log('Seeding coop balances...');
  await setDoc(doc(db, 'coop_balances', profileId1), {
    balance: 5,
    hours_earned: 10,
    hours_spent: 5
  });

  console.log('Seeding coop ledger...');
  await addDoc(collection(db, 'coop_ledger'), {
    parent_id: profileId1,
    counterpart_id: profileId2,
    session_date: new Date().toISOString(),
    hours_exchanged: 2,
    notes: 'Babysitting'
  });

  console.log('Done seeding!');
  process.exit(0);
}

seed().catch(console.error);
