/**
 * KADRO — Mini E-shop Τεχνολογίας & Περιφερειακών (Φάση 1 — Θέμα Β)
 *
 * Αρχιτεκτονική οργανωμένη σε διακριτά στρώματα (Separation of Concerns)
 * ώστε να μεταφέρεται με ελάχιστες αλλαγές στη Φάση 2 (React + Express + MongoDB):
 *
 *   1. Σταθερές & Αρχικά Δεδομένα (Seed Data — συμβατά με npm run seed Φάσης 2)
 *   2. StorageAdapter (localStorage wrapper — στη Φάση 2 αντικαθίσταται από API client)
 *   3. Validators (Pure συναρτήσεις επικύρωσης — κοινές για client & server στη Φάση 2)
 *   4. Domain Models (κλάσεις Product & Customer — συμβατές με Mongoose schemas)
 *   5. Stores (κλάσεις ProductStore & CustomerStore — επιχειρησιακή λογική CRUD)
 *   6. ExportImportService (Εξαγωγή JSON/CSV & Εισαγωγή JSON με επικύρωση)
 *   7. AppController (Σύνδεση DOM, Constraint Validation API, Modal & Undo Toast)
 */

'use strict';

/* ============================================================================
   1. ΣΤΑΘΕΡΕΣ & ΑΡΧΙΚΑ ΔΕΔΟΜΕΝΑ (SEED)
   ============================================================================ */

const STORAGE_KEYS = Object.freeze({
  PRODUCTS: 'products', // Απαιτούμενο κλειδί localStorage για Θέμα Β
  USERS: 'users',       // Αποθήκευση εγγεγραμμένων πελατών & έλεγχος μοναδικότητας email
});

const CATALOG_CATEGORIES = Object.freeze([
  'Πληκτρολόγια',
  'Ποντίκια',
  'Οθόνες',
  'Ήχος',
  'Αξεσουάρ Γραφείου',
]);

const UNDO_TIMEOUT_MS = 6000;

/**
 * Κανονικοποίηση κειμένου για αναζήτηση χωρίς διάκριση τόνων / πεζών-κεφαλαίων.
 * Π.χ. «ηχος» και «Ήχος» θεωρούνται ίδια.
 * @param {unknown} value
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('el-GR')
    .replace(/ς/g, 'σ');
}

/**
 * 12 ενδεικτικά προϊόντα τεχνολογίας & περιφερειακών γραφείου.
 * Φορτώνονται αυτόματα μόνο κατά την πρώτη επίσκεψη (όταν δεν υπάρχει κλειδί 'products').
 */
const SEED_PRODUCTS = Object.freeze([
  {
    id: 'prod-1001',
    name: 'Μηχανικό Πληκτρολόγιο Keychron Q1 Pro',
    category: 'Πληκτρολόγια',
    price: 219.0,
    available: true,
    description: 'Αλουμινένιο σώμα CNC, ασύρματη σύνδεση Bluetooth 5.1 και hot-swappable διακόπτες.',
    createdAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 'prod-1002',
    name: 'Ασύρματο Ποντίκι Logitech MX Master 3S',
    category: 'Ποντίκια',
    price: 109.9,
    available: true,
    description: 'Αισθητήρας 8000 DPI, αθόρυβα κλικ και ηλεκτρομαγνητική ροδέλα MagSpeed.',
    createdAt: '2026-10-04T10:15:00.000Z',
  },
  {
    id: 'prod-1003',
    name: 'Οθόνη Dell UltraSharp U2723QE 27" 4K',
    category: 'Οθόνες',
    price: 629.0,
    available: true,
    description: 'Πάνελ IPS Black, USB-C Hub 90W και 98% κάλυψη DCI-P3 για εργασία ακριβείας.',
    createdAt: '2026-10-05T11:30:00.000Z',
  },
  {
    id: 'prod-1004',
    name: 'Ακουστικά Sony WH-1000XM5',
    category: 'Ήχος',
    price: 349.0,
    available: true,
    description: 'Ενεργή ακύρωση θορύβου, 8 μικρόφωνα και αυτονομία έως 30 ώρες.',
    createdAt: '2026-10-06T14:20:00.000Z',
  },
  {
    id: 'prod-1005',
    name: 'Φωτιστικό Οθόνης BenQ ScreenBar Halo',
    category: 'Αξεσουάρ Γραφείου',
    price: 169.0,
    available: true,
    description: 'Ασύμμετρος φωτισμός χωρίς αντανακλάσεις με ασύρματο περιστροφικό χειριστήριο.',
    createdAt: '2026-10-07T08:45:00.000Z',
  },
  {
    id: 'prod-1006',
    name: 'Πληκτρολόγιο HHKB Professional Hybrid',
    category: 'Πληκτρολόγια',
    price: 315.0,
    available: false,
    description: 'Διάταξη 60% με ηλεκτροστατικούς διακόπτες Topre 45g.',
    createdAt: '2026-10-09T12:00:00.000Z',
  },
  {
    id: 'prod-1007',
    name: 'Οθόνη LG DualUp 28" Ergo 16:18',
    category: 'Οθόνες',
    price: 579.0,
    available: true,
    description: 'Κάθετη διάταξη για προγραμματισμό και multitasking με εργονομικό βραχίονα.',
    createdAt: '2026-10-10T16:10:00.000Z',
  },
  {
    id: 'prod-1008',
    name: 'Επιτραπέζιο Μικρόφωνο Shure MV7+',
    category: 'Ήχος',
    price: 289.0,
    available: true,
    description: 'Δυναμικό μικρόφωνο USB-C και XLR με ενσωματωμένο DSP για καθαρή φωνή.',
    createdAt: '2026-10-12T09:30:00.000Z',
  },
  {
    id: 'prod-1009',
    name: 'Επιφάνεια Γραφείου από Μάλλινη Τσόχα 90×40',
    category: 'Αξεσουάρ Γραφείου',
    price: 48.5,
    available: true,
    description: 'Αντιολισθητική βάση από φυσικό φελλό, ιδανική για πληκτρολόγιο και ποντίκι.',
    createdAt: '2026-10-14T15:00:00.000Z',
  },
  {
    id: 'prod-1010',
    name: 'Εργονομικό Ποντίκι Logitech Lift Vertical',
    category: 'Ποντίκια',
    price: 74.9,
    available: false,
    description: 'Γωνία κλίσης 57° για φυσική θέση καρπού και υποστήριξη 3 συσκευών.',
    createdAt: '2026-10-16T11:05:00.000Z',
  },
  {
    id: 'prod-1011',
    name: 'Σταθμός Σύνδεσης CalDigit TS4 Thunderbolt 4',
    category: 'Αξεσουάρ Γραφείου',
    price: 389.0,
    available: true,
    description: '18 θύρες επέκτασης, φόρτιση 98W και 2.5GbE Ethernet σε περίβλημα αλουμινίου.',
    createdAt: '2026-10-18T13:40:00.000Z',
  },
  {
    id: 'prod-1012',
    name: 'Ηχεία Γραφείου Audioengine A2+ Wireless',
    category: 'Ήχος',
    price: 269.0,
    available: true,
    description: 'Ενεργά ηχεία 60W με ενσωματωμένο DAC USB και Bluetooth aptX.',
    createdAt: '2026-10-20T17:25:00.000Z',
  },
]);

/* ============================================================================
   2. STORAGE ADAPTER LAYER (localStorage)
   Στη Φάση 2 αυτό το επίπεδο αντικαθίσταται από ασύγχρονες κλήσεις REST API.
   ============================================================================ */

class LocalStorageAdapter {
  /**
   * Ελέγχει αν υπάρχει αποθηκευμένο κλειδί στο localStorage.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Διαβάζει και αποκωδικοποιεί JSON από το localStorage.
   * @template T
   * @param {string} key
   * @param {T} fallback
   * @returns {T}
   */
  read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Αποθηκεύει δεδομένα ως JSON string στο localStorage.
   * @param {string} key
   * @param {unknown} value
   */
  write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Αποτυχία εγγραφής στο localStorage (${key}):`, error);
    }
  }
}

/* ============================================================================
   3. PURE VALIDATION LAYER (Χωρίς εξάρτηση από το DOM — έτοιμο για Φάση 2)
   ============================================================================ */

const Validators = Object.freeze({
  GREEK_UPPERCASE_PATTERN: /^[Α-ΡΣ-Ω]+(?:[ -][Α-ΡΣ-Ω]+)*$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  LETTER_PATTERN: /[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ]/,
  NUMBER_PATTERN: /[0-9]/,
  SYMBOL_PATTERN: /[!@#$%^&*]/,

  /**
   * Επικυρώνει ελληνικό όνομα/επώνυμο: αποκλειστικά κεφαλαία ελληνικά χωρίς τόνους,
   * με επιτρεπόμενο κενό ή παύλα για σύνθετα ονόματα (π.χ. ΓΕΩΡΓΙΟΣ, ΑΝΝΑ-ΜΑΡΙΑ).
   * @param {string} rawValue
   * @param {string} fieldLabel
   * @returns {{ valid: boolean, message: string }}
   */
  validateGreekUppercaseName(rawValue, fieldLabel) {
    const value = String(rawValue ?? '').trim();

    if (!value) {
      return { valid: false, message: `Το πεδίο «${fieldLabel}» είναι υποχρεωτικό.` };
    }

    if (/[α-ωά-ώ]/.test(value)) {
      return {
        valid: false,
        message: 'Επιτρέπονται μόνο κεφαλαία ελληνικά γράμματα (όχι πεζά).',
      };
    }

    if (/[ΆΈΉΊΌΎΏΪΫ]/.test(value)) {
      return {
        valid: false,
        message: 'Μην χρησιμοποιείτε τόνους ή διαλυτικά στα κεφαλαία ελληνικά.',
      };
    }

    if (/[^Α-ΡΣ-Ω -]/.test(value)) {
      return {
        valid: false,
        message: 'Επιτρέπονται μόνο κεφαλαίοι ελληνικοί χαρακτήρες (όχι λατινικοί ή αριθμοί).',
      };
    }

    if (/^[ -]|[ -]$|[ -]{2,}/.test(value)) {
      return {
        valid: false,
        message: 'Το κενό ή η παύλα επιτρέπονται μόνο ανάμεσα σε λέξεις.',
      };
    }

    if (!this.GREEK_UPPERCASE_PATTERN.test(value)) {
      return {
        valid: false,
        message: 'Μη έγκυρη μορφή (παράδειγμα έγκυρης τιμής: ΓΕΩΡΓΙΟΣ ή ΑΝΝΑ-ΜΑΡΙΑ).',
      };
    }

    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει μορφή email και προαιρετικά τη μοναδικότητά του.
   * @param {string} rawEmail
   * @param {(email: string) => boolean} [isDuplicateFn]
   * @returns {{ valid: boolean, message: string }}
   */
  validateEmail(rawEmail, isDuplicateFn) {
    const value = String(rawEmail ?? '').trim();

    if (!value) {
      return { valid: false, message: 'Το email είναι υποχρεωτικό.' };
    }

    if (!this.EMAIL_PATTERN.test(value)) {
      return { valid: false, message: 'Εισάγετε έγκυρη διεύθυνση email (π.χ. name@example.gr).' };
    }

    if (typeof isDuplicateFn === 'function' && isDuplicateFn(value)) {
      return {
        valid: false,
        message: 'Αυτό το email χρησιμοποιείται ήδη (δεν επιτρέπονται διπλότυπα).',
      };
    }

    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Ελέγχει αναλυτικά τους 4 κανόνες πολυπλοκότητας κωδικού πρόσβασης.
   * @param {string} password
   * @returns {{ minLength: boolean, hasLetter: boolean, hasNumber: boolean, hasSymbol: boolean, allMet: boolean }}
   */
  evaluatePasswordRules(password) {
    const value = String(password ?? '');
    const minLength = value.length >= 8;
    const hasLetter = this.LETTER_PATTERN.test(value);
    const hasNumber = this.NUMBER_PATTERN.test(value);
    const hasSymbol = this.SYMBOL_PATTERN.test(value);

    return {
      minLength,
      hasLetter,
      hasNumber,
      hasSymbol,
      allMet: minLength && hasLetter && hasNumber && hasSymbol,
    };
  },

  /**
   * Επικυρώνει το πεδίο password και επιστρέφει στοχευμένο μήνυμα λάθους.
   * @param {string} password
   * @returns {{ valid: boolean, message: string, rules: ReturnType<typeof Validators.evaluatePasswordRules> }}
   */
  validatePassword(password) {
    const value = String(password ?? '');
    const rules = this.evaluatePasswordRules(value);

    if (!value) {
      return { valid: false, message: 'Ο κωδικός πρόσβασης είναι υποχρεωτικός.', rules };
    }

    const missing = [];
    if (!rules.minLength) missing.push('τουλάχιστον 8 χαρακτήρες');
    if (!rules.hasLetter) missing.push('τουλάχιστον 1 γράμμα');
    if (!rules.hasNumber) missing.push('τουλάχιστον 1 αριθμό');
    if (!rules.hasSymbol) missing.push('ένα σύμβολο (!@#$%^&*)');

    if (missing.length > 0) {
      return {
        valid: false,
        message: `Απαιτείται: ${missing.join(', ')}.`,
        rules,
      };
    }

    return { valid: true, message: 'Έγκυρο', rules };
  },

  /**
   * Επικυρώνει την επιβεβαίωση του κωδικού πρόσβασης.
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {{ valid: boolean, message: string }}
   */
  validateConfirmPassword(password, confirmPassword) {
    const confirm = String(confirmPassword ?? '');

    if (!confirm) {
      return { valid: false, message: 'Η επιβεβαίωση του κωδικού είναι υποχρεωτική.' };
    }

    if (confirm !== String(password ?? '')) {
      return { valid: false, message: 'Οι δύο κωδικοί πρόσβασης δεν ταιριάζουν.' };
    }

    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει το πεδίο ρόλου (User ή Admin).
   * @param {string} role
   * @returns {{ valid: boolean, message: string }}
   */
  validateRole(role) {
    if (role !== 'User' && role !== 'Admin') {
      return { valid: false, message: 'Επιλέξτε έγκυρο ρόλο (User ή Admin).' };
    }
    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει ημερομηνία εγγραφής μορφής YYYY-MM-DD.
   * @param {string} dateStr
   * @returns {{ valid: boolean, message: string }}
   */
  validateDate(dateStr) {
    const value = String(dateStr ?? '').trim();
    if (!value) {
      return { valid: false, message: 'Η ημερομηνία εγγραφής είναι υποχρεωτική.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      return { valid: false, message: 'Εισάγετε έγκυρη ημερομηνία.' };
    }
    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει όνομα προϊόντος (2–120 χαρακτήρες).
   * @param {string} rawName
   * @param {(name: string) => boolean} [isDuplicateFn]
   * @returns {{ valid: boolean, message: string }}
   */
  validateProductName(rawName, isDuplicateFn) {
    const value = String(rawName ?? '').trim();
    if (!value) {
      return { valid: false, message: 'Το όνομα προϊόντος είναι υποχρεωτικό.' };
    }
    if (value.length < 2) {
      return { valid: false, message: 'Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.' };
    }
    if (value.length > 120) {
      return { valid: false, message: 'Το όνομα δεν μπορεί να ξεπερνά τους 120 χαρακτήρες.' };
    }
    if (typeof isDuplicateFn === 'function' && isDuplicateFn(value)) {
      return { valid: false, message: 'Υπάρχει ήδη προϊόν με το ίδιο όνομα στον κατάλογο.' };
    }
    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει την κατηγορία προϊόντος.
   * @param {string} category
   * @returns {{ valid: boolean, message: string }}
   */
  validateProductCategory(category) {
    const value = String(category ?? '').trim();
    if (!value) {
      return { valid: false, message: 'Η επιλογή κατηγορίας είναι υποχρεωτική.' };
    }
    if (!CATALOG_CATEGORIES.includes(value)) {
      return {
        valid: false,
        message: `Μη έγκυρη κατηγορία. Επιτρεπόμενες: ${CATALOG_CATEGORIES.join(', ')}.`,
      };
    }
    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει τιμή προϊόντος (θετικός αριθμός έως 99.999 €).
   * @param {string|number} rawPrice
   * @returns {{ valid: boolean, message: string }}
   */
  validateProductPrice(rawPrice) {
    if (rawPrice === '' || rawPrice === null || rawPrice === undefined) {
      return { valid: false, message: 'Η τιμή προϊόντος είναι υποχρεωτική.' };
    }
    const price = Number(rawPrice);
    if (!Number.isFinite(price)) {
      return { valid: false, message: 'Η τιμή πρέπει να είναι έγκυρος αριθμός.' };
    }
    if (price < 0.01) {
      return { valid: false, message: 'Η τιμή πρέπει να είναι μεγαλύτερη από 0,00 €.' };
    }
    if (price > 99999) {
      return { valid: false, message: 'Η τιμή δεν μπορεί να ξεπερνά τα 99.999,00 €.' };
    }
    return { valid: true, message: 'Έγκυρο' };
  },

  /**
   * Επικυρώνει προαιρετική περιγραφή προϊόντος.
   * @param {string} rawDesc
   * @returns {{ valid: boolean, message: string }}
   */
  validateProductDescription(rawDesc) {
    const value = String(rawDesc ?? '').trim();
    if (value.length > 180) {
      return { valid: false, message: 'Η περιγραφή δεν μπορεί να ξεπερνά τους 180 χαρακτήρες.' };
    }
    return { valid: true, message: value ? 'Έγκυρο' : '' };
  },

  /**
   * Συνολική επικύρωση αντικειμένου προϊόντος (χρησιμοποιείται σε φόρμα & εισαγωγή JSON).
   * @param {Record<string, unknown>} payload
   * @param {(name: string) => boolean} [isDuplicateNameFn]
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateProductPayload(payload, isDuplicateNameFn) {
    const errors = [];
    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Η εγγραφή δεν είναι έγκυρο αντικείμενο JSON.'] };
    }

    const nameCheck = this.validateProductName(payload.name, isDuplicateNameFn);
    if (!nameCheck.valid) errors.push(nameCheck.message);

    const catCheck = this.validateProductCategory(payload.category);
    if (!catCheck.valid) errors.push(catCheck.message);

    const priceCheck = this.validateProductPrice(payload.price);
    if (!priceCheck.valid) errors.push(priceCheck.message);

    if (typeof payload.available !== 'boolean') {
      errors.push('Το πεδίο διαθεσιμότητας (available) πρέπει να είναι true ή false.');
    }

    const descCheck = this.validateProductDescription(payload.description ?? '');
    if (!descCheck.valid) errors.push(descCheck.message);

    return { valid: errors.length === 0, errors };
  },
});

/* ============================================================================
   4. DOMAIN MODELS (Κλάσεις Product & Customer)
   Συμβατές με τα μελλοντικά Mongoose schemas (products, users) της Φάσης 2.
   ============================================================================ */

class Product {
  /**
   * @param {{
   *   id?: string,
   *   name: string,
   *   category: string,
   *   price: number,
   *   available: boolean,
   *   description?: string,
   *   createdAt?: string
   * }} params
   */
  constructor({ id, name, category, price, available, description = '', createdAt }) {
    this.id = id || Product.generateId();
    this.name = String(name).trim();
    this.category = String(category).trim();
    this.price = Math.round(Number(price) * 100) / 100;
    this.available = Boolean(available);
    this.description = String(description ?? '').trim();
    this.createdAt = createdAt || new Date().toISOString();
  }

  static generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `prod-${crypto.randomUUID().slice(0, 8)}`;
    }
    return `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Επιστρέφει καθαρό αντικείμενο JSON για αποθήκευση ή εξαγωγή.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      price: this.price,
      available: this.available,
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  static fromJSON(raw) {
    return new Product({
      id: raw.id,
      name: raw.name,
      category: raw.category,
      price: raw.price,
      available: raw.available,
      description: raw.description ?? '',
      createdAt: raw.createdAt,
    });
  }
}

class Customer {
  /**
   * @param {{
   *   id?: string,
   *   firstName: string,
   *   lastName: string,
   *   email: string,
   *   role: 'User' | 'Admin',
   *   registeredAt: string,
   *   password: string
   * }} params
   */
  constructor({ id, firstName, lastName, email, role, registeredAt, password }) {
    this.id = id || Customer.generateId();
    this.firstName = String(firstName).trim();
    this.lastName = String(lastName).trim();
    this.email = String(email).trim().toLowerCase();
    this.role = role === 'Admin' ? 'Admin' : 'User';
    this.registeredAt = String(registeredAt).trim();
    // Σημείωση: Σε πραγματική εφαρμογή (Φάση 2) ο κωδικός γίνεται hash με bcrypt στον server.
    this.password = String(password);
  }

  static generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `usr-${crypto.randomUUID().slice(0, 8)}`;
    }
    return `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      registeredAt: this.registeredAt,
      password: this.password,
    };
  }

  /**
   * Ασφαλής προβολή χωρίς τον κωδικό πρόσβασης για εμφάνιση στο UI.
   */
  toPublicJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      registeredAt: this.registeredAt,
    };
  }

  static fromJSON(raw) {
    return new Customer(raw);
  }
}

/* ============================================================================
   5. STORES (Κλάσεις ProductStore & CustomerStore)
   Διαχειρίζονται τις συλλογές στη μνήμη και συγχρονίζουν με το StorageAdapter.
   ============================================================================ */

class ProductStore {
  /**
   * @param {LocalStorageAdapter} storage
   * @param {string} storageKey
   */
  constructor(storage, storageKey = STORAGE_KEYS.PRODUCTS) {
    this.storage = storage;
    this.storageKey = storageKey;
    /** @type {Product[]} */
    this.products = [];
    this.load();
  }

  /**
   * Φορτώνει τα προϊόντα από το localStorage (κλειδί 'products').
   * Αν δεν υπάρχει ακόμη κλειδί, αρχικοποιεί με τον ενδεικτικό κατάλογο.
   */
  load() {
    if (!this.storage.has(this.storageKey)) {
      this.products = SEED_PRODUCTS.map((item) => Product.fromJSON(item));
      this.save();
      return;
    }

    const stored = this.storage.read(this.storageKey, []);
    if (Array.isArray(stored)) {
      this.products = stored
        .filter((item) => item && typeof item === 'object' && item.name)
        .map((item) => Product.fromJSON(item));
    } else {
      this.products = [];
    }
  }

  save() {
    this.storage.write(
      this.storageKey,
      this.products.map((p) => p.toJSON())
    );
  }

  getAll() {
    return [...this.products];
  }

  findById(id) {
    return this.products.find((p) => p.id === id) || null;
  }

  /**
   * Ελέγχει αν υπάρχει ήδη προϊόν με το ίδιο όνομα (case-insensitive).
   * @param {string} name
   * @param {string | null} [excludeId]
   */
  hasDuplicateName(name, excludeId = null) {
    const normalized = String(name ?? '').trim().toLocaleLowerCase('el-GR');
    return this.products.some(
      (p) => p.id !== excludeId && p.name.toLocaleLowerCase('el-GR') === normalized
    );
  }

  /**
   * Προσθήκη νέου προϊόντος στην αρχή του καταλόγου.
   */
  add(payload) {
    const product = new Product(payload);
    this.products.unshift(product);
    this.save();
    return product;
  }

  /**
   * Ενημέρωση υπάρχοντος προϊόντος.
   */
  update(id, payload) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.products[index];
    const updated = new Product({
      id: existing.id,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      available: payload.available,
      description: payload.description ?? '',
      createdAt: existing.createdAt,
    });

    this.products[index] = updated;
    this.save();
    return updated;
  }

  /**
   * Διαγραφή προϊόντος με επιστροφή του αντικειμένου και της αρχικής του θέσης (για Αναίρεση).
   * @param {string} id
   * @returns {{ product: Product, index: number } | null}
   */
  remove(id) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const [removed] = this.products.splice(index, 1);
    this.save();
    return { product: removed, index };
  }

  /**
   * Επαναφέρει διαγραμμένο προϊόν στην ακριβή αρχική του θέση (Bonus: Undo Delete).
   * @param {Product} product
   * @param {number} index
   */
  restoreAt(product, index) {
    const safeIndex = Math.max(0, Math.min(index, this.products.length));
    this.products.splice(safeIndex, 0, product);
    this.save();
  }

  /**
   * Επαναφορά του καταλόγου στα 12 ενδεικτικά προϊόντα.
   */
  resetToSeed() {
    this.products = SEED_PRODUCTS.map((item) => Product.fromJSON(item));
    this.save();
  }

  /**
   * Υπολογίζει συνοπτικούς δείκτες για την επικεφαλίδα.
   */
  getStats() {
    const total = this.products.length;
    const availableCount = this.products.filter((p) => p.available).length;
    const activeCategories = new Set(this.products.map((p) => p.category)).size;
    const avgPrice =
      total > 0
        ? this.products.reduce((sum, p) => sum + p.price, 0) / total
        : 0;

    return { total, availableCount, activeCategories, avgPrice };
  }

  /**
   * Συνδυαστική αναζήτηση, φιλτράρισμα, ταξινόμηση και σελιδοποίηση.
   * @param {{
   *   search: string,
   *   category: string,
   *   availability: 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK',
   *   sortBy: 'name' | 'category' | 'price' | 'available' | null,
   *   sortDir: 'asc' | 'desc',
   *   page: number,
   *   pageSize: number
   * }} options
   */
  query({ search, category, availability, sortBy, sortDir, page, pageSize }) {
    const queryText = normalizeSearchText(String(search ?? '').trim());

    // 1. Φιλτράρισμα & Αναζήτηση
    let filtered = this.products.filter((product) => {
      if (category && category !== 'ALL' && product.category !== category) {
        return false;
      }

      if (availability === 'IN_STOCK' && !product.available) return false;
      if (availability === 'OUT_OF_STOCK' && product.available) return false;

      if (queryText) {
        const haystack = normalizeSearchText(
          `${product.name} ${product.category} ${product.description}`
        );
        if (!haystack.includes(queryText)) return false;
      }

      return true;
    });

    // 2. Ταξινόμηση
    if (sortBy) {
      const direction = sortDir === 'desc' ? -1 : 1;
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'price') {
          return (a.price - b.price) * direction;
        }
        if (sortBy === 'available') {
          return (Number(a.available) - Number(b.available)) * direction;
        }
        return String(a[sortBy]).localeCompare(String(b[sortBy]), 'el-GR', {
          sensitivity: 'base',
        }) * direction;
      });
    }

    // 3. Σελιδοποίηση
    const totalFiltered = filtered.length;
    const safePageSize = Math.max(1, Number(pageSize) || 6);
    const totalPages = Math.max(1, Math.ceil(totalFiltered / safePageSize));
    const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));
    const startIndex = (currentPage - 1) * safePageSize;
    const items = filtered.slice(startIndex, startIndex + safePageSize);

    return {
      items,
      totalFiltered,
      totalPages,
      currentPage,
      startIndex,
      endIndex: startIndex + items.length,
    };
  }

  /**
   * Εισαγωγή προϊόντων από πίνακα JSON με αυστηρή επικύρωση και απόρριψη διπλότυπων.
   * @param {unknown[]} rawItems
   * @returns {{ added: number, rejected: number, errors: string[] }}
   */
  importBatch(rawItems) {
    if (!Array.isArray(rawItems)) {
      return {
        added: 0,
        rejected: 0,
        errors: ['Το αρχείο JSON πρέπει να περιέχει έναν πίνακα (array) προϊόντων.'],
      };
    }

    let added = 0;
    let rejected = 0;
    const errors = [];
    const seenNames = new Set(
      this.products.map((p) => p.name.toLocaleLowerCase('el-GR'))
    );

    rawItems.forEach((rawItem, idx) => {
      const rowNum = idx + 1;
      const check = Validators.validateProductPayload(rawItem, (name) =>
        seenNames.has(name.toLocaleLowerCase('el-GR'))
      );

      if (!check.valid) {
        rejected += 1;
        if (errors.length < 6) {
          errors.push(`Εγγραφή #${rowNum}: ${check.errors[0]}`);
        }
        return;
      }

      const product = new Product({
        name: rawItem.name,
        category: rawItem.category,
        price: Number(rawItem.price),
        available: rawItem.available,
        description: rawItem.description ?? '',
      });

      this.products.unshift(product);
      seenNames.add(product.name.toLocaleLowerCase('el-GR'));
      added += 1;
    });

    if (added > 0) {
      this.save();
    }

    return { added, rejected, errors };
  }
}

class CustomerStore {
  /**
   * @param {LocalStorageAdapter} storage
   * @param {string} storageKey
   */
  constructor(storage, storageKey = STORAGE_KEYS.USERS) {
    this.storage = storage;
    this.storageKey = storageKey;
    /** @type {Customer[]} */
    this.customers = [];
    this.load();
  }

  load() {
    const stored = this.storage.read(this.storageKey, []);
    if (Array.isArray(stored)) {
      this.customers = stored
        .filter((item) => item && typeof item === 'object' && item.email)
        .map((item) => Customer.fromJSON(item));
    } else {
      this.customers = [];
    }
  }

  save() {
    this.storage.write(
      this.storageKey,
      this.customers.map((c) => c.toJSON())
    );
  }

  getPublicList() {
    return this.customers.map((c) => c.toPublicJSON());
  }

  /**
   * Ελέγχει αν υπάρχει ήδη πελάτης με το συγκεκριμένο email (case-insensitive).
   * @param {string} email
   */
  isEmailTaken(email) {
    const normalized = String(email ?? '').trim().toLowerCase();
    return this.customers.some((c) => c.email === normalized);
  }

  /**
   * Καταχωρεί νέο πελάτη και ενημερώνει το localStorage ('users').
   */
  register(payload) {
    const customer = new Customer(payload);
    this.customers.unshift(customer);
    this.save();
    return customer.toPublicJSON();
  }
}

/* ============================================================================
   6. EXPORT & IMPORT SERVICE (Bonus: Εξαγωγή CSV/JSON & Εισαγωγή JSON)
   ============================================================================ */

const ExportImportService = Object.freeze({
  /**
   * Κατεβάζει ένα αρχείο κειμένου στον browser του χρήστη.
   * @param {string} content
   * @param {string} filename
   * @param {string} mimeType
   */
  triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Εξάγει τα προϊόντα σε μορφοποιημένο αρχείο JSON.
   * @param {Product[]} products
   */
  exportJSON(products) {
    const json = JSON.stringify(
      products.map((p) => p.toJSON()),
      null,
      2
    );
    this.triggerDownload(json, 'kadro-products.json', 'application/json;charset=utf-8');
  },

  /**
   * Εξάγει τα προϊόντα σε CSV με UTF-8 BOM ώστε τα ελληνικά να εμφανίζονται σωστά στο Excel.
   * @param {Product[]} products
   */
  exportCSV(products) {
    const escapeCell = (val) => {
      const str = String(val ?? '');
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['ID', 'Όνομα', 'Κατηγορία', 'Τιμή (€)', 'Διαθεσιμότητα', 'Περιγραφή'];
    const rows = products.map((p) => [
      p.id,
      p.name,
      p.category,
      p.price.toFixed(2),
      p.available ? 'Διαθέσιμο' : 'Εξαντλημένο',
      p.description,
    ]);

    const csvLines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
    const csvWithBom = `\uFEFF${csvLines.join('\r\n')}`;
    this.triggerDownload(csvWithBom, 'kadro-products.csv', 'text/csv;charset=utf-8');
  },

  /**
   * Διαβάζει και αναλύει αρχείο JSON μέσω FileReader.
   * @param {File} file
   * @returns {Promise<unknown>}
   */
  readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result ?? ''));
          resolve(parsed);
        } catch {
          reject(new Error('Το αρχείο δεν περιέχει έγκυρη σύνταξη JSON.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Αποτυχία ανάγνωσης του αρχείου.'));
      };
      reader.readAsText(file, 'utf-8');
    });
  },
});

/* ============================================================================
   7. UI CONTROLLER & EVENT BINDING
   ============================================================================ */

class AppController {
  constructor() {
    this.storage = new LocalStorageAdapter();
    this.productStore = new ProductStore(this.storage, STORAGE_KEYS.PRODUCTS);
    this.customerStore = new CustomerStore(this.storage, STORAGE_KEYS.USERS);

    // Κατάσταση προβολής καταλόγου
    this.state = {
      search: '',
      category: 'ALL',
      availability: 'ALL',
      sortBy: null,
      sortDir: 'asc',
      page: 1,
      pageSize: 6,
      editingId: null,
    };

    // Κατάσταση Undo διαγραφής & Modal
    this.undoTimerId = null;
    this.pendingModalAction = null;
    this.lastFocusedElement = null;

    // Μορφοποιητής τιμών σε ευρώ (ελληνική μορφή)
    this.currencyFormatter = new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    this.cacheDom();
    this.initDefaults();
    this.bindEvents();
    this.renderAll();
  }

  cacheDom() {
    // Εισαγωγή & Δείκτες
    this.metricTotal = document.getElementById('metric-total');
    this.metricAvailable = document.getElementById('metric-available');
    this.metricCategories = document.getElementById('metric-categories');
    this.metricAvgPrice = document.getElementById('metric-avg-price');
    this.ctaNewProduct = document.getElementById('cta-new-product');

    // Toolbar & Πίνακας
    this.searchInput = document.getElementById('search-input');
    this.categoryFilter = document.getElementById('category-filter');
    this.availabilityFilter = document.getElementById('availability-filter');
    this.pageSizeSelect = document.getElementById('page-size-select');
    this.resultsSummary = document.getElementById('results-summary');
    this.productsTable = document.getElementById('products-table');
    this.productsTbody = document.getElementById('products-tbody');
    this.sortButtons = Array.from(document.querySelectorAll('.sort-btn'));
    this.emptyState = document.getElementById('empty-state');
    this.emptyStateTitle = document.getElementById('empty-state-title');
    this.emptyStateDesc = document.getElementById('empty-state-desc');
    this.resetFiltersBtn = document.getElementById('reset-filters-btn');
    this.paginationBar = document.getElementById('pagination-bar');
    this.paginationInfo = document.getElementById('pagination-info');
    this.paginationControls = document.getElementById('pagination-controls');

    // Φόρμα Προϊόντος
    this.productFormSection = document.getElementById('product-form-section');
    this.productFormHeading = document.getElementById('product-form-heading');
    this.productFormSubtitle = document.getElementById('product-form-subtitle');
    this.productForm = document.getElementById('product-form');
    this.productIdInput = document.getElementById('product-id');
    this.productNameInput = document.getElementById('product-name');
    this.productCategoryInput = document.getElementById('product-category');
    this.productPriceInput = document.getElementById('product-price');
    this.productAvailabilityInput = document.getElementById('product-availability');
    this.productDescriptionInput = document.getElementById('product-description');
    this.productSubmitBtn = document.getElementById('product-submit-btn');
    this.productResetBtn = document.getElementById('product-reset-btn');
    this.cancelEditBtn = document.getElementById('cancel-edit-btn');

    // Εξαγωγή / Εισαγωγή
    this.exportJsonBtn = document.getElementById('export-json-btn');
    this.exportCsvBtn = document.getElementById('export-csv-btn');
    this.importJsonInput = document.getElementById('import-json-input');
    this.importReport = document.getElementById('import-report');
    this.restoreSeedBtn = document.getElementById('restore-seed-btn');

    // Φόρμα Εγγραφής Πελάτη
    this.customerForm = document.getElementById('customer-form');
    this.customerFirstNameInput = document.getElementById('customer-first-name');
    this.customerLastNameInput = document.getElementById('customer-last-name');
    this.customerEmailInput = document.getElementById('customer-email');
    this.customerRoleInput = document.getElementById('customer-role');
    this.customerRegDateInput = document.getElementById('customer-reg-date');
    this.customerPasswordInput = document.getElementById('customer-password');
    this.customerConfirmPasswordInput = document.getElementById('customer-confirm-password');
    this.togglePasswordBtn = document.getElementById('toggle-password-btn');
    this.customerResetBtn = document.getElementById('customer-reset-btn');

    this.passwordRuleEls = {
      minLength: document.getElementById('rule-length'),
      hasLetter: document.getElementById('rule-letter'),
      hasNumber: document.getElementById('rule-number'),
      hasSymbol: document.getElementById('rule-symbol'),
    };

    // Λίστα Εγγεγραμμένων Πελατών
    this.customersList = document.getElementById('customers-list');
    this.customersEmpty = document.getElementById('customers-empty');
    this.customersCount = document.getElementById('customers-count');

    // Modal & Toasts
    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmModalTitle = document.getElementById('confirm-modal-title');
    this.confirmModalMessage = document.getElementById('confirm-modal-message');
    this.confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    this.confirmOkBtn = document.getElementById('confirm-ok-btn');
    this.toastRegion = document.getElementById('toast-region');
  }

  initDefaults() {
    this.setTodayRegistrationDate();
  }

  /**
   * Προσυμπληρώνει την ημερομηνία εγγραφής με τη σημερινή τοπική ημερομηνία (YYYY-MM-DD).
   */
  setTodayRegistrationDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.customerRegDateInput.value = `${year}-${month}-${day}`;
  }

  bindEvents() {
    // Κύριο CTA κεφαλίδας -> κύλιση και εστίαση στη φόρμα προϊόντος
    this.ctaNewProduct.addEventListener('click', () => {
      if (this.state.editingId) {
        this.exitEditMode();
      }
      this.productFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => this.productNameInput.focus(), 220);
    });

    // Αναζήτηση & Φίλτρα (ζωντανή ενημέρωση + επαναφορά στη σελίδα 1)
    this.searchInput.addEventListener('input', () => {
      this.state.search = this.searchInput.value;
      this.state.page = 1;
      this.renderCatalog();
    });

    this.categoryFilter.addEventListener('change', () => {
      this.state.category = this.categoryFilter.value;
      this.state.page = 1;
      this.renderCatalog();
    });

    this.availabilityFilter.addEventListener('change', () => {
      this.state.availability = this.availabilityFilter.value;
      this.state.page = 1;
      this.renderCatalog();
    });

    this.pageSizeSelect.addEventListener('change', () => {
      this.state.pageSize = Number(this.pageSizeSelect.value) || 6;
      this.state.page = 1;
      this.renderCatalog();
    });

    this.resetFiltersBtn.addEventListener('click', () => {
      if (this.productStore.getAll().length === 0) {
        this.productFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.productNameInput.focus();
        return;
      }
      this.state.search = '';
      this.state.category = 'ALL';
      this.state.availability = 'ALL';
      this.state.page = 1;
      this.searchInput.value = '';
      this.categoryFilter.value = 'ALL';
      this.availabilityFilter.value = 'ALL';
      this.renderCatalog();
    });

    // Ταξινόμηση στηλών
    this.sortButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.sort;
        if (this.state.sortBy === field) {
          this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.state.sortBy = field;
          this.state.sortDir = 'asc';
        }
        this.state.page = 1;
        this.renderCatalog();
      });
    });

    // Event delegation για Επεξεργασία & Διαγραφή στον πίνακα προϊόντων
    this.productsTbody.addEventListener('click', (event) => {
      const targetBtn = event.target.closest('button[data-action]');
      if (!targetBtn) return;

      const { action, id } = targetBtn.dataset;
      if (action === 'edit') {
        this.enterEditMode(id);
      } else if (action === 'delete') {
        this.requestDeleteProduct(id);
      }
    });

    // Event delegation για κουμπιά σελιδοποίησης
    this.paginationControls.addEventListener('click', (event) => {
      const pageBtn = event.target.closest('button[data-page]');
      if (!pageBtn || pageBtn.disabled) return;
      this.state.page = Number(pageBtn.dataset.page);
      this.renderCatalog();
    });

    // Live validation & υποβολή φόρμας προϊόντος
    const productFields = [
      this.productNameInput,
      this.productCategoryInput,
      this.productPriceInput,
      this.productAvailabilityInput,
      this.productDescriptionInput,
    ];
    productFields.forEach((field) => {
      field.addEventListener('input', () => this.validateProductField(field));
      field.addEventListener('change', () => this.validateProductField(field));
    });

    this.productForm.addEventListener('submit', (event) => this.handleProductSubmit(event));
    this.productResetBtn.addEventListener('click', () => this.resetProductForm());
    this.cancelEditBtn.addEventListener('click', () => this.exitEditMode());

    // Εξαγωγή & Εισαγωγή (Bonus)
    this.exportJsonBtn.addEventListener('click', () => {
      const all = this.productStore.getAll();
      if (all.length === 0) {
        this.showToast('Δεν υπάρχουν προϊόντα για εξαγωγή.', { variant: 'error' });
        return;
      }
      ExportImportService.exportJSON(all);
      this.showToast(`Εξήχθησαν ${all.length} προϊόντα σε αρχείο JSON.`);
    });

    this.exportCsvBtn.addEventListener('click', () => {
      const all = this.productStore.getAll();
      if (all.length === 0) {
        this.showToast('Δεν υπάρχουν προϊόντα για εξαγωγή.', { variant: 'error' });
        return;
      }
      ExportImportService.exportCSV(all);
      this.showToast(`Εξήχθησαν ${all.length} προϊόντα σε αρχείο CSV.`);
    });

    this.importJsonInput.addEventListener('change', (event) => this.handleImportJSON(event));

    this.restoreSeedBtn.addEventListener('click', () => {
      this.openConfirmModal({
        title: 'Επαναφορά ενδεικτικού καταλόγου',
        message: 'Θέλετε να αντικαταστήσετε τον τρέχοντα κατάλογο με τα 12 ενδεικτικά προϊόντα τεχνολογίας;',
        confirmLabel: 'Επαναφορά',
        onConfirm: () => {
          this.exitEditMode();
          this.productStore.resetToSeed();
          this.state.page = 1;
          this.renderAll();
          this.showToast('Ο ενδεικτικός κατάλογος επαναφέρθηκε επιτυχώς.');
        },
      });
    });

    // Live validation φόρμας εγγραφής πελάτη (Constraint Validation API)
    const customerFields = [
      this.customerFirstNameInput,
      this.customerLastNameInput,
      this.customerEmailInput,
      this.customerRoleInput,
      this.customerRegDateInput,
      this.customerPasswordInput,
      this.customerConfirmPasswordInput,
    ];

    customerFields.forEach((field) => {
      field.addEventListener('input', () => this.handleCustomerFieldLiveInput(field));
      field.addEventListener('change', () => this.handleCustomerFieldLiveInput(field));
    });

    this.togglePasswordBtn.addEventListener('click', () => {
      const isHidden = this.customerPasswordInput.type === 'password';
      this.customerPasswordInput.type = isHidden ? 'text' : 'password';
      this.customerConfirmPasswordInput.type = isHidden ? 'text' : 'password';
      this.togglePasswordBtn.textContent = isHidden ? 'Απόκρυψη' : 'Εμφάνιση';
      this.togglePasswordBtn.setAttribute('aria-pressed', String(isHidden));
      this.togglePasswordBtn.setAttribute(
        'aria-label',
        isHidden ? 'Απόκρυψη κωδικού πρόσβασης' : 'Εμφάνιση κωδικού πρόσβασης'
      );
    });

    this.customerForm.addEventListener('submit', (event) => this.handleCustomerSubmit(event));
    this.customerResetBtn.addEventListener('click', () => this.resetCustomerForm());

    // Modal επιβεβαίωσης (κουμπιά, backdrop και Escape)
    this.confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal());
    this.confirmOkBtn.addEventListener('click', () => {
      const action = this.pendingModalAction;
      this.closeConfirmModal();
      if (typeof action === 'function') action();
    });
    this.confirmModal.addEventListener('click', (event) => {
      if (event.target === this.confirmModal) {
        this.closeConfirmModal();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.confirmModal.hidden) {
        this.closeConfirmModal();
      }
    });
  }

  /* ---------- Επικύρωση Φόρμας Προϊόντος (Constraint Validation API) ---------- */

  validateProductField(field) {
    let result = { valid: true, message: 'Έγκυρο' };

    switch (field.id) {
      case 'product-name':
        result = Validators.validateProductName(field.value, (name) =>
          this.productStore.hasDuplicateName(name, this.state.editingId)
        );
        break;
      case 'product-category':
        result = Validators.validateProductCategory(field.value);
        break;
      case 'product-price':
        result = Validators.validateProductPrice(field.value);
        break;
      case 'product-availability':
        result =
          field.value === 'true' || field.value === 'false'
            ? { valid: true, message: 'Έγκυρο' }
            : { valid: false, message: 'Επιλέξτε διαθεσιμότητα.' };
        break;
      case 'product-description':
        result = Validators.validateProductDescription(field.value);
        break;
      default:
        break;
    }

    // Εφαρμογή Constraint Validation API
    field.setCustomValidity(result.valid ? '' : result.message);
    const isValid = field.checkValidity();

    this.renderFieldFeedback(field, isValid, isValid ? result.message : field.validationMessage);
    return isValid;
  }

  handleProductSubmit(event) {
    event.preventDefault();

    const fields = [
      this.productNameInput,
      this.productCategoryInput,
      this.productPriceInput,
      this.productAvailabilityInput,
      this.productDescriptionInput,
    ];

    let allValid = true;
    let firstInvalid = null;

    fields.forEach((field) => {
      const ok = this.validateProductField(field);
      if (!ok) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!allValid || !this.productForm.checkValidity()) {
      firstInvalid?.focus();
      return;
    }

    const payload = {
      name: this.productNameInput.value.trim(),
      category: this.productCategoryInput.value,
      price: Number(this.productPriceInput.value),
      available: this.productAvailabilityInput.value === 'true',
      description: this.productDescriptionInput.value.trim(),
    };

    if (this.state.editingId) {
      const updated = this.productStore.update(this.state.editingId, payload);
      this.exitEditMode();
      this.renderAll();
      if (updated) {
        this.showToast(`Το προϊόν «${updated.name}» ενημερώθηκε.`);
      }
    } else {
      const created = this.productStore.add(payload);
      this.resetProductForm();
      this.state.page = 1;
      this.renderAll();
      this.showToast(`Το προϊόν «${created.name}» προστέθηκε στον κατάλογο.`);
    }
  }

  enterEditMode(productId) {
    const product = this.productStore.findById(productId);
    if (!product) return;

    this.state.editingId = product.id;
    this.productIdInput.value = product.id;
    this.productNameInput.value = product.name;
    this.productCategoryInput.value = product.category;
    this.productPriceInput.value = product.price.toFixed(2);
    this.productAvailabilityInput.value = String(product.available);
    this.productDescriptionInput.value = product.description;

    this.productFormHeading.textContent = '02. Επεξεργασία Προϊόντος';
    this.productFormSubtitle.textContent = `Επεξεργάζεστε το προϊόν «${product.name}».`;
    this.productSubmitBtn.textContent = 'Ενημέρωση προϊόντος';
    this.cancelEditBtn.hidden = false;

    // Επικύρωση προ-συμπληρωμένων πεδίων
    [
      this.productNameInput,
      this.productCategoryInput,
      this.productPriceInput,
      this.productAvailabilityInput,
      this.productDescriptionInput,
    ].forEach((f) => this.validateProductField(f));

    this.renderCatalog();
    this.productFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => this.productNameInput.focus(), 200);
  }

  exitEditMode() {
    this.state.editingId = null;
    this.productIdInput.value = '';
    this.productFormHeading.textContent = '02. Προσθήκη Νέου Προϊόντος';
    this.productFormSubtitle.textContent =
      'Συμπληρώστε τα στοιχεία για να προσθέσετε νέο είδος στον κατάλογο.';
    this.productSubmitBtn.textContent = 'Αποθήκευση προϊόντος';
    this.cancelEditBtn.hidden = true;
    this.resetProductForm();
    this.renderCatalog();
  }

  resetProductForm() {
    this.productForm.reset();
    this.productAvailabilityInput.value = 'true';
    [
      this.productNameInput,
      this.productCategoryInput,
      this.productPriceInput,
      this.productAvailabilityInput,
      this.productDescriptionInput,
    ].forEach((field) => {
      field.setCustomValidity('');
      this.clearFieldFeedback(field);
    });
  }

  /* ---------- Διαγραφή Προϊόντος & Αναίρεση (Bonus: Undo Delete) ---------- */

  requestDeleteProduct(productId) {
    const product = this.productStore.findById(productId);
    if (!product) return;

    this.openConfirmModal({
      title: 'Διαγραφή προϊόντος',
      message: `Είστε βέβαιοι ότι θέλετε να διαγράψετε το προϊόν «${product.name}» από τον κατάλογο;`,
      confirmLabel: 'Διαγραφή',
      onConfirm: () => {
        if (this.state.editingId === productId) {
          this.exitEditMode();
        }

        const removed = this.productStore.remove(productId);
        if (!removed) return;

        this.renderAll();
        this.showUndoDeleteToast(removed.product, removed.index);
      },
    });
  }

  showUndoDeleteToast(deletedProduct, originalIndex) {
    if (this.undoTimerId) {
      window.clearTimeout(this.undoTimerId);
      this.undoTimerId = null;
    }

    // Αφαίρεση προηγούμενου undo toast αν υπάρχει
    const existingUndo = this.toastRegion.querySelector('.toast-undo');
    if (existingUndo) existingUndo.remove();

    const toast = document.createElement('div');
    toast.className = 'toast toast-undo';
    toast.setAttribute('role', 'status');

    const textSpan = document.createElement('span');
    textSpan.textContent = `Διαγράφηκε: «${deletedProduct.name}»`;

    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Αναίρεση';

    const progressBar = document.createElement('span');
    progressBar.className = 'toast-progress';
    progressBar.style.animationDuration = `${UNDO_TIMEOUT_MS}ms`;

    undoBtn.addEventListener('click', () => {
      if (this.undoTimerId) {
        window.clearTimeout(this.undoTimerId);
        this.undoTimerId = null;
      }
      this.productStore.restoreAt(deletedProduct, originalIndex);
      toast.remove();
      this.renderAll();
      this.showToast(`Το προϊόν «${deletedProduct.name}» επαναφέρθηκε στη θέση του.`);
    });

    toast.append(textSpan, undoBtn, progressBar);
    this.toastRegion.appendChild(toast);

    this.undoTimerId = window.setTimeout(() => {
      toast.remove();
      this.undoTimerId = null;
    }, UNDO_TIMEOUT_MS);
  }

  /* ---------- Εισαγωγή Αρχείου JSON (Bonus) ---------- */

  async handleImportJSON(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await ExportImportService.readJSONFile(file);
      const report = this.productStore.importBatch(parsed);
      this.renderImportReport(report);

      if (report.added > 0) {
        this.state.page = 1;
        this.renderAll();
        this.showToast(`Εισήχθησαν επιτυχώς ${report.added} νέα προϊόντα.`);
      } else {
        this.showToast('Δεν προστέθηκαν προϊόντα. Ελέγξτε την αναφορά εισαγωγής.', {
          variant: 'error',
        });
      }
    } catch (err) {
      this.renderImportReport({
        added: 0,
        rejected: 0,
        errors: [err.message || 'Μη έγκυρο αρχείο JSON.'],
      });
      this.showToast(err.message || 'Αποτυχία εισαγωγής αρχείου.', { variant: 'error' });
    } finally {
      // Επιτρέπει επανα-επιλογή του ίδιου αρχείου
      event.target.value = '';
    }
  }

  renderImportReport(report) {
    this.importReport.hidden = false;
    this.importReport.textContent = '';

    const summary = document.createElement('p');
    summary.className = 'import-report-summary';
    summary.textContent = `Αποτέλεσμα εισαγωγής: ${report.added} αποδεκτά, ${report.rejected} απορριφθέντα.`;
    this.importReport.appendChild(summary);

    if (report.errors.length > 0) {
      const list = document.createElement('ul');
      list.className = 'import-report-errors';
      report.errors.forEach((msg) => {
        const li = document.createElement('li');
        li.textContent = msg;
        list.appendChild(li);
      });
      this.importReport.appendChild(list);
    }
  }

  /* ---------- Επικύρωση Φόρμας Εγγραφής Πελάτη (Live Validation + Constraint API) ---------- */

  handleCustomerFieldLiveInput(field) {
    this.validateCustomerField(field);

    // Όταν αλλάζει το password, επαναξιολογούμε και την επιβεβαίωση αν έχει ήδη τιμή
    if (
      field === this.customerPasswordInput &&
      this.customerConfirmPasswordInput.value.length > 0
    ) {
      this.validateCustomerField(this.customerConfirmPasswordInput);
    }
  }

  validateCustomerField(field) {
    let result = { valid: true, message: 'Έγκυρο' };

    switch (field.id) {
      case 'customer-first-name':
        result = Validators.validateGreekUppercaseName(field.value, 'Όνομα');
        break;
      case 'customer-last-name':
        result = Validators.validateGreekUppercaseName(field.value, 'Επώνυμο');
        break;
      case 'customer-email':
        result = Validators.validateEmail(field.value, (email) =>
          this.customerStore.isEmailTaken(email)
        );
        break;
      case 'customer-role':
        result = Validators.validateRole(field.value);
        break;
      case 'customer-reg-date':
        result = Validators.validateDate(field.value);
        break;
      case 'customer-password': {
        const pwdCheck = Validators.validatePassword(field.value);
        this.renderPasswordRules(pwdCheck.rules);
        result = { valid: pwdCheck.valid, message: pwdCheck.message };
        break;
      }
      case 'customer-confirm-password':
        result = Validators.validateConfirmPassword(
          this.customerPasswordInput.value,
          field.value
        );
        break;
      default:
        break;
    }

    // Constraint Validation API (setCustomValidity + checkValidity)
    field.setCustomValidity(result.valid ? '' : result.message);
    const isValid = field.checkValidity();

    this.renderFieldFeedback(field, isValid, isValid ? 'Έγκυρο' : field.validationMessage);
    return isValid;
  }

  renderPasswordRules(rules) {
    Object.entries(this.passwordRuleEls).forEach(([ruleKey, el]) => {
      if (!el) return;
      const met = Boolean(rules[ruleKey]);
      el.dataset.met = String(met);
      const mark = el.querySelector('.rule-mark');
      if (mark) {
        mark.textContent = met ? '✔' : '✘';
      }
    });
  }

  handleCustomerSubmit(event) {
    event.preventDefault();

    const fields = [
      this.customerFirstNameInput,
      this.customerLastNameInput,
      this.customerEmailInput,
      this.customerRoleInput,
      this.customerRegDateInput,
      this.customerPasswordInput,
      this.customerConfirmPasswordInput,
    ];

    let allValid = true;
    let firstInvalid = null;

    fields.forEach((field) => {
      const ok = this.validateCustomerField(field);
      if (!ok) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!allValid || !this.customerForm.checkValidity()) {
      firstInvalid?.focus();
      return;
    }

    const registered = this.customerStore.register({
      firstName: this.customerFirstNameInput.value.trim(),
      lastName: this.customerLastNameInput.value.trim(),
      email: this.customerEmailInput.value.trim(),
      role: this.customerRoleInput.value,
      registeredAt: this.customerRegDateInput.value,
      password: this.customerPasswordInput.value,
    });

    this.resetCustomerForm();
    this.renderCustomers();
    this.showToast(
      `Ο πελάτης ${registered.firstName} ${registered.lastName} εγγράφηκε επιτυχώς.`
    );
  }

  resetCustomerForm() {
    this.customerForm.reset();
    this.customerRoleInput.value = 'User';
    this.setTodayRegistrationDate();

    [
      this.customerFirstNameInput,
      this.customerLastNameInput,
      this.customerEmailInput,
      this.customerRoleInput,
      this.customerRegDateInput,
      this.customerPasswordInput,
      this.customerConfirmPasswordInput,
    ].forEach((field) => {
      field.setCustomValidity('');
      this.clearFieldFeedback(field);
    });

    this.renderPasswordRules({
      minLength: false,
      hasLetter: false,
      hasNumber: false,
      hasSymbol: false,
    });
  }

  /* ---------- Βοηθητικές Συναρτήσεις Οπτικής Ανατροφοδότησης Πεδίων ---------- */

  renderFieldFeedback(field, isValid, message) {
    const feedbackEl = document.getElementById(`${field.id}-feedback`);
    field.classList.remove('is-valid', 'is-invalid');

    if (!message && isValid) {
      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'field-feedback';
      }
      return;
    }

    field.classList.add(isValid ? 'is-valid' : 'is-invalid');
    field.setAttribute('aria-invalid', String(!isValid));

    if (feedbackEl) {
      feedbackEl.textContent = isValid ? `✔ ${message}` : `✘ ${message}`;
      feedbackEl.className = `field-feedback ${isValid ? 'is-valid' : 'is-invalid'}`;
    }
  }

  clearFieldFeedback(field) {
    const feedbackEl = document.getElementById(`${field.id}-feedback`);
    field.classList.remove('is-valid', 'is-invalid');
    field.removeAttribute('aria-invalid');
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'field-feedback';
    }
  }

  /* ---------- Απόδοση Διεπαφής (Rendering) ---------- */

  renderAll() {
    this.renderMetrics();
    this.renderCatalog();
    this.renderCustomers();
  }

  renderMetrics() {
    const stats = this.productStore.getStats();
    this.metricTotal.textContent = String(stats.total);
    this.metricAvailable.textContent = String(stats.availableCount);
    this.metricCategories.textContent = String(stats.activeCategories);
    this.metricAvgPrice.textContent = this.currencyFormatter.format(stats.avgPrice);
  }

  renderCatalog() {
    const result = this.productStore.query(this.state);
    this.state.page = result.currentPage;

    // Ενημέρωση δεικτών ταξινόμησης (aria-sort)
    this.sortButtons.forEach((btn) => {
      const th = btn.closest('th');
      const indicator = btn.querySelector('.sort-indicator');
      if (!th || !indicator) return;

      if (this.state.sortBy === btn.dataset.sort) {
        const isAsc = this.state.sortDir === 'asc';
        th.setAttribute('aria-sort', isAsc ? 'ascending' : 'descending');
        indicator.textContent = isAsc ? '↑' : '↓';
      } else {
        th.setAttribute('aria-sort', 'none');
        indicator.textContent = '↕';
      }
    });

    const totalAll = this.productStore.getAll().length;
    this.resultsSummary.textContent =
      result.totalFiltered === totalAll
        ? `${totalAll} προϊόντα`
        : `${result.totalFiltered} από ${totalAll} προϊόντα`;

    // Ενημέρωση γραμμών πίνακα (με καθαρό DOM API — ασφαλές έναντι XSS)
    this.productsTbody.textContent = '';

    if (result.items.length === 0) {
      this.productsTable.hidden = true;
      this.emptyState.hidden = false;
      this.paginationBar.hidden = true;

      if (totalAll === 0) {
        this.emptyStateTitle.textContent = 'Δεν βρέθηκαν προϊόντα';
        this.emptyStateDesc.textContent =
          'Ο κατάλογος είναι κενός. Προσθέστε το πρώτο σας προϊόν από τη φόρμα παρακάτω.';
        this.resetFiltersBtn.textContent = 'Προσθήκη προϊόντος';
      } else {
        this.emptyStateTitle.textContent = 'Δεν βρέθηκαν προϊόντα';
        this.emptyStateDesc.textContent =
          'Δεν υπάρχουν εγγραφές που να ταιριάζουν με την αναζήτηση ή τα επιλεγμένα φίλτρα.';
        this.resetFiltersBtn.textContent = 'Επαναφορά φίλτρων';
      }
      return;
    }

    this.productsTable.hidden = false;
    this.emptyState.hidden = true;

    const fragment = document.createDocumentFragment();
    result.items.forEach((product) => {
      fragment.appendChild(this.createProductRow(product));
    });
    this.productsTbody.appendChild(fragment);

    this.renderPagination(result);
  }

  createProductRow(product) {
    const tr = document.createElement('tr');
    if (this.state.editingId === product.id) {
      tr.classList.add('is-editing');
    }

    // 1. Προϊόν (Όνομα + σύντομη περιγραφή)
    const tdName = document.createElement('td');
    tdName.dataset.label = 'Προϊόν';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'product-title-cell';
    titleDiv.textContent = product.name;
    tdName.appendChild(titleDiv);

    if (product.description) {
      const descDiv = document.createElement('div');
      descDiv.className = 'product-desc-cell';
      descDiv.textContent = product.description;
      tdName.appendChild(descDiv);
    }

    // 2. Κατηγορία
    const tdCat = document.createElement('td');
    tdCat.dataset.label = 'Κατηγορία';
    const catSpan = document.createElement('span');
    catSpan.className = 'category-text';
    catSpan.textContent = product.category;
    tdCat.appendChild(catSpan);

    // 3. Τιμή (tabular-nums)
    const tdPrice = document.createElement('td');
    tdPrice.dataset.label = 'Τιμή';
    tdPrice.className = 'price-cell tabular-nums';
    tdPrice.textContent = this.currencyFormatter.format(product.price);

    // 4. Διαθεσιμότητα (καθαρό κείμενο + σύμβολο, χωρίς pill boxes)
    const tdAvail = document.createElement('td');
    tdAvail.dataset.label = 'Διαθεσιμότητα';
    const availSpan = document.createElement('span');
    availSpan.className = `availability-text ${product.available ? 'in-stock' : 'out-of-stock'}`;
    availSpan.textContent = product.available ? '✔ Διαθέσιμο' : '✘ Εξαντλημένο';
    tdAvail.appendChild(availSpan);

    // 5. Ενέργειες (Επεξεργασία & Διαγραφή)
    const tdActions = document.createElement('td');
    tdActions.dataset.label = 'Ενέργειες';
    tdActions.className = 'col-actions';

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-ghost btn-table';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = product.id;
    editBtn.textContent = 'Επεξεργασία';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-ghost-danger btn-table';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = product.id;
    deleteBtn.textContent = 'Διαγραφή';

    actionsWrap.append(editBtn, deleteBtn);
    tdActions.appendChild(actionsWrap);

    tr.append(tdName, tdCat, tdPrice, tdAvail, tdActions);
    return tr;
  }

  renderPagination(queryResult) {
    this.paginationBar.hidden = false;
    const from = queryResult.startIndex + 1;
    const to = queryResult.endIndex;
    this.paginationInfo.textContent = `Εμφάνιση ${from}–${to} από ${queryResult.totalFiltered} προϊόντα · Σελίδα ${queryResult.currentPage} από ${queryResult.totalPages}`;

    this.paginationControls.textContent = '';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Προηγούμενη';
    prevBtn.disabled = queryResult.currentPage <= 1;
    prevBtn.dataset.page = String(queryResult.currentPage - 1);
    this.paginationControls.appendChild(prevBtn);

    for (let pageNum = 1; pageNum <= queryResult.totalPages; pageNum += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn tabular-nums';
      btn.textContent = String(pageNum);
      btn.dataset.page = String(pageNum);
      if (pageNum === queryResult.currentPage) {
        btn.setAttribute('aria-current', 'page');
      }
      this.paginationControls.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Επόμενη';
    nextBtn.disabled = queryResult.currentPage >= queryResult.totalPages;
    nextBtn.dataset.page = String(queryResult.currentPage + 1);
    this.paginationControls.appendChild(nextBtn);
  }

  renderCustomers() {
    const customers = this.customerStore.getPublicList();
    this.customersCount.textContent = String(customers.length);
    this.customersList.textContent = '';

    if (customers.length === 0) {
      this.customersEmpty.hidden = false;
      return;
    }

    this.customersEmpty.hidden = true;
    const fragment = document.createDocumentFragment();

    customers.forEach((customer) => {
      const li = document.createElement('li');
      li.className = 'customer-row';

      const nameEl = document.createElement('p');
      nameEl.className = 'customer-name';
      nameEl.textContent = `${customer.firstName} ${customer.lastName}`;

      const metaEl = document.createElement('p');
      metaEl.className = 'customer-meta';

      const emailSpan = document.createElement('span');
      emailSpan.textContent = customer.email;

      const sep1 = document.createElement('span');
      sep1.className = 'meta-sep';
      sep1.setAttribute('aria-hidden', 'true');
      sep1.textContent = '·';

      const roleSpan = document.createElement('span');
      roleSpan.textContent = customer.role;

      const sep2 = document.createElement('span');
      sep2.className = 'meta-sep';
      sep2.setAttribute('aria-hidden', 'true');
      sep2.textContent = '·';

      const dateSpan = document.createElement('span');
      dateSpan.className = 'tabular-nums';
      dateSpan.textContent = customer.registeredAt;

      metaEl.append(emailSpan, sep1, roleSpan, sep2, dateSpan);
      li.append(nameEl, metaEl);
      fragment.appendChild(li);
    });

    this.customersList.appendChild(fragment);
  }

  /* ---------- Modal Επιβεβαίωσης & Toasts ---------- */

  openConfirmModal({ title, message, confirmLabel = 'Επιβεβαίωση', onConfirm }) {
    this.lastFocusedElement = document.activeElement;
    this.confirmModalTitle.textContent = title;
    this.confirmModalMessage.textContent = message;
    this.confirmOkBtn.textContent = confirmLabel;
    this.pendingModalAction = onConfirm;
    this.confirmModal.hidden = false;
    this.confirmCancelBtn.focus();
  }

  closeConfirmModal() {
    this.confirmModal.hidden = true;
    this.pendingModalAction = null;
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
  }

  showToast(message, { variant = 'default', durationMs = 3600 } = {}) {
    const toast = document.createElement('div');
    toast.className = `toast ${variant === 'error' ? 'toast-error' : ''}`.trim();
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    this.toastRegion.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, durationMs);
  }
}

/* ============================================================================
   ΕΚΚΙΝΗΣΗ ΕΦΑΡΜΟΓΗΣ
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
