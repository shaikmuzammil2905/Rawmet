import { getDb } from "./db";
import { hashPassword } from "./auth";
import type { AboutContent, ContactSettings, HeroSlide, LaunchingOfferContent } from "./types";

export function ensureSeeded(): void {
  if (globalThis.__rawmetSeeded) return;
  const db = getDb();

  const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`).get();
  if (existingAdmin) {
    syncUpdatedMedia(db);
    globalThis.__rawmetSeeded = true;
    return;
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@rawmet.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "RawmetAdmin#2026";

  db.exec("BEGIN TRANSACTION");
  try {
    // 1. Seed Users (Admin, 4 Verified Vendors, 1 Paid Customer, 1 Free Customer)
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `);

    insertUser.run("RAWMET Admin", adminEmail, "7382177653", "917382177653", hashPassword(adminPassword), "admin");

    const v1User = insertUser.run("Rajesh Kulkarni", "sales@bharatrubber.in", "9820112233", "919820112233", hashPassword("Vendor@123"), "vendor");
    const v2User = insertUser.run("Anand Mehta", "info@shreepolymers.in", "9845098765", "919845098765", hashPassword("Vendor@123"), "vendor");
    const v3User = insertUser.run("Vikram SteelWorks", "dispatch@deccanmetals.in", "9900112244", "919900112244", hashPassword("Vendor@123"), "vendor");
    const v4User = insertUser.run("Srinivas Rao", "projects@srinidhiindustrial.in", "9848011223", "919848011223", hashPassword("Vendor@123"), "vendor");

    const custPaid = insertUser.run("Karan Malhotra", "karan@apexmanufacturing.in", "9811223344", "919811223344", hashPassword("Customer@123"), "customer");
    insertUser.run("Priya Nair", "priya@keralapackaging.in", "9895112233", "919895112233", hashPassword("Customer@123"), "customer");

    // 2. Seed Verified Vendors
    const insertVendor = db.prepare(`
      INSERT INTO vendors (
        user_id, business_name, owner_name, mobile, whatsapp, email,
        business_category, product_service_category, gst_number, id_proof_type,
        address, city, state, description, product_details, verification_status,
        whatsapp_opt_in, whatsapp_categories
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'GST Certificate', ?, ?, ?, ?, ?, 'approved', 1, ?)
    `);

    const v1 = insertVendor.run(
      v1User.lastInsertRowid,
      "Bharat Elastomers & Rubber Co.",
      "Rajesh Kulkarni",
      "9820112233",
      "919820112233",
      "sales@bharatrubber.in",
      "Manufacturer & Bulk Supplier",
      "rubber",
      "27AABCB1234F1Z5",
      "Plot 42, MIDC Industrial Area, Chakan",
      "Pune",
      "Maharashtra",
      "ISO 9001 certified manufacturer of industrial rubber sheets, EPDM seals, conveyor belts, and reclaimed rubber.",
      "Natural Rubber RSS4, EPDM Sheets, Neoprene Pads, Industrial Tires, Rubber Extrusion Machinery",
      JSON.stringify(["rubber", "rubber-machineries"])
    );

    const v2 = insertVendor.run(
      v2User.lastInsertRowid,
      "Shree Sai Polymers & Granules",
      "Anand Mehta",
      "9845098765",
      "919845098765",
      "info@shreepolymers.in",
      "Polymer Distributor & Machinery Partner",
      "plastic",
      "24AAACS5678M1Z9",
      "GIDC Phase III, Vatva Industrial Estate",
      "Ahmedabad",
      "Gujarat",
      "Leading Pan-India supplier of virgin & reprocessed HDPE, PP, LDPE granules and precision injection molding lines.",
      "HDPE Blow Grade, PP Raffia Granules, LLDPE Film Grade, Twin-Screw Extruders",
      JSON.stringify(["plastic", "plastic-machineries", "bio-petro-chemical"])
    );

    const v3 = insertVendor.run(
      v3User.lastInsertRowid,
      "Deccan Alloy & Metal Tubes Pvt. Ltd.",
      "Vikram Deshmukh",
      "9900112244",
      "919900112244",
      "dispatch@deccanmetals.in",
      "Rolling Mill & Steel Fabricator",
      "metals",
      "36AAACD9012K1Z2",
      "IDA Jeedimetla, Phase II, Survey 118",
      "Hyderabad",
      "Telangana",
      "Industrial supplier of SS304/316 seamless pipes, HR/CR steel coils, aluminum billets, and turnkey rolling plants.",
      "SS 304 Seamless Pipes, Mild Steel Plates, Aluminum Ingots, Steel Rolling Plants, Vehicle Body Fabrication",
      JSON.stringify(["metals", "metals-plants", "vehicle-fabrication"])
    );

    const v4 = insertVendor.run(
      v4User.lastInsertRowid,
      "Sriñidhi Industrial Engineering & Services",
      "Srinivas Rao",
      "9848011223",
      "919848011223",
      "projects@srinidhiindustrial.in",
      "Turnkey Plant & Industrial Services",
      "services",
      "36AABCS4411P1Z8",
      "Balanagar Industrial Park, Sector 4",
      "Hyderabad",
      "Telangana",
      "End-to-end industrial manpower, annual maintenance contracts (AMC), bio-petrochemical plant erection, logistics & enterprise support.",
      "Manpower Supply, Plant AMC, Bio-Diesel Distillation Units, Industrial Logistics, Mechanical Fabrication",
      JSON.stringify(["bio-petro-chemical", "bpc-plants", "manpower-services", "amc", "maintenance-services", "mechanical-services", "logistics-services", "loans-services", "business-registrations", "website-app-services"])
    );

    // 3. Seed Categories (Products, Machineries, Services)
    const insertCat = db.prepare(`
      INSERT INTO categories (type, name, slug, description, image_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    // Products (4)
    const cProdRubber = insertCat.run("product", "Rubber", "rubber", "Natural, synthetic, EPDM, silicone sheets, conveyor rolls, and industrial rubber compounds.", "/images/cat-thumb-rubber.png", 1);
    const cProdPlastic = insertCat.run("product", "Plastic", "plastic", "Virgin & recycled HDPE, PP, LDPE, PVC polymer granules, resins, and masterbatches.", "/images/cat-thumb-plastic.png", 2);
    const cProdMetals = insertCat.run("product", "Metals", "metals", "Stainless steel pipes, HR/CR coils, structural steel, aluminum billets, and non-ferrous alloys.", "/images/cat-thumb-metals.png", 3);
    const cProdBpc = insertCat.run("product", "Bio Petro Chemical", "bio-petro-chemical", "Industrial solvents, bio-fuels, base oils, petrochemicals, bitumen, and specialty chemicals.", "/images/cat-thumb-bpc.png", 4);

    // Machineries (5)
    const cMachRubber = insertCat.run("machinery", "Rubber Machineries", "rubber-machineries", "Kneaders, two-roll mixing mills, hydraulic vulcanizing presses, and tire retreading lines.", "/images/cat-machineries.png", 1);
    const cMachPlastic = insertCat.run("machinery", "Plastic Machineries", "plastic-machineries", "Injection molding machines, blown film extruders, blow molding, and recycling pelletizers.", "/images/cat-machineries.png", 2);
    const cMachMetals = insertCat.run("machinery", "Metals – Plants", "metals-plants", "Rolling mills, induction melting furnaces, CNC plasma cutters, and tube mill lines.", "/images/metal-pipes.png", 3);
    const cMachBpc = insertCat.run("machinery", "BPC – Plants", "bpc-plants", "Bio-diesel processing plants, distillation columns, pyrolysis units, and chemical reactors.", "/images/refinery-plant.png", 4);
    const cMachVehicle = insertCat.run("machinery", "Vehicle – Fabrication – Bodybuilders", "vehicle-fabrication", "Tipper bodies, tanker fabrication, insulated containers, trailers, and hydraulic tail-lifts.", "/images/cat-machineries.png", 5);

    // Services (8)
    insertCat.run("service", "Manpower Services", "manpower-services", "Skilled plant operators, certified welders, safety officers, and factory floor workforce.", "/images/service-manpower.png", 1);
    insertCat.run("service", "AMC", "amc", "Annual Maintenance Contracts for boilers, compressors, HVAC, molding lines, and utilities.", "/images/service-amc.png", 2);
    insertCat.run("service", "Maintenance Services", "maintenance-services", "Preventive & breakdown industrial maintenance, alignment, calibration, and shutdown support.", "/images/service-maintenance.png", 3);
    insertCat.run("service", "Mechanical Services", "mechanical-services", "Heavy structural erection, pipeline fabrication, lathe machining, and gearbox overhauls.", "/images/service-mechanical.png", 4);
    insertCat.run("service", "Logistics Services", "logistics-services", "FTL/PTL industrial freight, ODC heavy machinery transport, and container movement Pan-India.", "/images/service-logistics.png", 5);
    insertCat.run("service", "Loans Services", "loans-services", "MSME working capital, machinery term loans, bill discounting, and project finance advisory.", "/images/service-loans.png", 6);
    insertCat.run("service", "Business Registrations", "business-registrations", "GST registration, Udyam MSME, Factory License, Pollution Board NOC, and ISO certifications.", "/images/service-registrations.svg", 7);
    insertCat.run("service", "Website / App Services", "website-app-services", "Custom B2B industrial portals, ERP integrations, inventory mobile apps, and digital branding.", "/images/service-webapp.svg", 8);

    // 4. Seed Subcategories
    const insertSub = db.prepare(`INSERT INTO subcategories (category_id, name, slug, description) VALUES (?, ?, ?, ?)`);
    insertSub.run(cProdRubber.lastInsertRowid, "Industrial Rubber Sheets", "industrial-rubber-sheets", "EPDM, Neoprene, Nitrile & Natural rubber rolls");
    insertSub.run(cProdRubber.lastInsertRowid, "Tyres & Conveyor Belts", "tyres-conveyor-belts", "Heavy-duty industrial tyres and heat-resistant conveyor belts");
    insertSub.run(cProdPlastic.lastInsertRowid, "HDPE & PP Granules", "hdpe-pp-granules", "Virgin & reprocessed molding/extrusion polymer granules");
    insertSub.run(cProdPlastic.lastInsertRowid, "Engineering Plastics & Masterbatch", "engineering-plastics", "ABS, Nylon, Polycarbonate & UV color masterbatches");
    insertSub.run(cProdMetals.lastInsertRowid, "Stainless Steel Pipes & Tubes", "ss-pipes-tubes", "Seamless & ERW SS304/SS316 industrial piping");
    insertSub.run(cProdMetals.lastInsertRowid, "Steel Coils & Non-Ferrous Alloys", "steel-coils-alloys", "HR/CR coils, aluminum ingots, copper busbars");
    insertSub.run(cProdBpc.lastInsertRowid, "Bio-Fuels & Base Oils", "bio-fuels-base-oils", "Biodiesel B100, SN150/500 base oils, industrial lubricants");
    insertSub.run(cProdBpc.lastInsertRowid, "Industrial Solvents & Petrochemicals", "solvents-petrochemicals", "Xylene, Toluene, Bitumen VG30/VG40, paraffin wax");
    insertSub.run(cMachRubber.lastInsertRowid, "Mixing Mills & Kneaders", "mixing-mills-kneaders", "Dispersion kneaders and two-roll rubber mills");
    insertSub.run(cMachPlastic.lastInsertRowid, "Injection & Extrusion Lines", "injection-extrusion-lines", "Servo injection molding & blown film machines");
    insertSub.run(cMachMetals.lastInsertRowid, "Furnaces & Rolling Mills", "furnaces-rolling-mills", "Induction furnaces & rebar rolling lines");
    insertSub.run(cMachBpc.lastInsertRowid, "Distillation & Pyrolysis Plants", "distillation-pyrolysis-plants", "Turnkey continuous distillation and bio-refinery units");
    insertSub.run(cMachVehicle.lastInsertRowid, "Tipper, Tanker & Container Bodies", "tipper-tanker-bodies", "Heavy commercial vehicle fabrication & body building");

    // 5. Seed Listings (Approved rich catalog across Products, Machineries, Services)
    const insertListing = db.prepare(`
      INSERT INTO listings (
        vendor_id, type, category_slug, subcategory_slug, title, slug,
        short_description, description, specifications, location,
        price_display, availability, image_url, gallery_urls, status, featured, views_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
    `);

    // Products
    insertListing.run(
      v1.lastInsertRowid, "product", "rubber", "industrial-rubber-sheets",
      "Heavy-Duty EPDM & Neoprene Rubber Conveyor Rolls",
      "heavy-duty-epdm-neoprene-rubber-rolls",
      "Weather-resistant, high-tensile industrial rubber rolls and sheets for mining, cement, and automotive gaskets.",
      "Manufactured under ISO 9001 quality controls using virgin EPDM and synthetic elastomer blends. Engineered for superior abrasion resistance, thermal stability (-40°C to +130°C), and ozone durability across heavy industrial environments.",
      JSON.stringify({ "Thickness": "2mm – 25mm", "Width": "1000mm – 1800mm", "Shore Hardness": "60 ± 5 Shore A", "Tensile Strength": "14 MPa", "MOQ": "500 Kg" }),
      "Pune, Maharashtra", "₹185 – ₹260 / Kg", "In Stock (Ready Dispatch)",
      "/images/rubber-roll.png", JSON.stringify(["/images/rubber-roll.png", "/images/cat-products.png"]), 1, 342
    );

    insertListing.run(
      v1.lastInsertRowid, "product", "rubber", "tyres-conveyor-belts",
      "Industrial OTR & Heavy-Load Pneumatic Rubber Tyres",
      "industrial-otr-heavy-load-tyres",
      "Reinforced deep-tread off-the-road tyres for forklifts, loaders, mining dumpers, and industrial trailers.",
      "High-load radial and bias-ply industrial tyres built with cut-resistant sidewall compounds and reinforced steel belts. Available in standard forklift, skid-steer, and quarry dumper sizes with Pan-India bulk supply.",
      JSON.stringify({ "Ply Rating": "16 PR – 24 PR", "Tread Compound": "Cut & Heat Resistant", "Application": "Forklifts, Mining, Earthmovers", "Warranty": "24 Months Manufacturing", "MOQ": "10 Units" }),
      "Pune, Maharashtra", "₹14,500 – ₹48,000 / Unit", "In Stock",
      "/images/cat-products.png", JSON.stringify(["/images/cat-products.png", "/images/rubber-roll.png"]), 1, 219
    );

    insertListing.run(
      v2.lastInsertRowid, "product", "plastic", "hdpe-pp-granules",
      "Virgin & Reprocessed HDPE / PP Injection Grade Granules",
      "virgin-hdpe-pp-injection-granules",
      "High-purity white natural & custom blue HDPE/PP polymer pellets for blow molding, crates, and pipes.",
      "Consistent MFI (Melt Flow Index) polymer granules sourced from Reliance/IOCL prime grades and ultrasonic-washed reprocessed streams. Ideal for industrial crates, jerry cans, HDPE pressure pipes, and automotive moldings.",
      JSON.stringify({ "Polymer Type": "HDPE / PP Copolymer", "MFI (190°C/2.16kg)": "4.0 – 12.0 g/10min", "Density": "0.952 g/cm³", "Packaging": "25 Kg PP Woven Bags", "MOQ": "1 Metric Ton" }),
      "Ahmedabad, Gujarat", "₹96 – ₹128 / Kg", "In Stock (50 MT Ready)",
      "/images/plastic-granules.png", JSON.stringify(["/images/plastic-granules.png", "/images/hero-desktop-1.png"]), 1, 415
    );

    insertListing.run(
      v2.lastInsertRowid, "product", "plastic", "engineering-plastics",
      "Color Masterbatch & UV-Stabilized LLDPE Film Granules",
      "uv-stabilized-lldpe-masterbatch",
      "High-dispersion industrial blue & custom polymer masterbatches with UV protection for packaging & agricultural films.",
      "Precision twin-screw compounded masterbatches offering high pigment loading (40%–60%), zero agglomerates, and food-contact compliance options for blown film, roto-molding tanks, and woven sacks.",
      JSON.stringify({ "Carrier Resin": "LLDPE / PP", "Pigment Loading": "Up to 55%", "UV Stability": "3000+ Hours QUV", "Dosage": "1% – 3%", "MOQ": "500 Kg" }),
      "Ahmedabad, Gujarat", "₹145 – ₹210 / Kg", "Made to Order (3 Days)",
      "/images/plastic-granules.png", JSON.stringify(["/images/plastic-granules.png"]), 0, 168
    );

    insertListing.run(
      v3.lastInsertRowid, "product", "metals", "ss-pipes-tubes",
      "ASTM A312 SS304 / SS316L Seamless Industrial Steel Pipes",
      "astm-a312-ss304-seamless-pipes",
      "Precision pickled & passivated stainless steel seamless pipes for chemical refineries, boilers, and food plants.",
      "Supplied with EN 10204 3.1 Mill Test Certificates. Full ultrasonic and hydrostatic testing completed for high-pressure refinery, heat exchanger, and pharmaceutical piping applications.",
      JSON.stringify({ "Grades": "SS 304, 304L, 316, 316L", "Size Range": "1/2\" NB to 24\" NB", "Schedule": "SCH 10S, 40S, 80S", "Length": "6 Meters Random / Cut", "Certification": "IBR & NACE Compliant" }),
      "Hyderabad, Telangana", "₹285 – ₹420 / Kg", "In Stock",
      "/images/metal-pipes.png", JSON.stringify(["/images/metal-pipes.png", "/images/refinery-plant.png"]), 1, 388
    );

    insertListing.run(
      v3.lastInsertRowid, "product", "metals", "steel-coils-alloys",
      "IS 2062 Hot Rolled (HR) Steel Coils & Structural Plates",
      "is2062-hr-steel-coils-plates",
      "Prime mill-certified E250/E350 HR steel coils and heavy plates for fabrication, boilers, and heavy engineering.",
      "Direct mill supply from SAIL/JSW/Tata stocks with slitting and cut-to-length facility available in-house. Suitable for heavy structural fabrication, storage tanks, and automotive chassis.",
      JSON.stringify({ "Grade": "IS 2062 E250 / E350", "Thickness": "2.0mm – 50mm", "Width": "1250mm / 1500mm / 2000mm", "Finish": "Mill Edge / Pickled & Oiled", "MOQ": "5 Metric Tons" }),
      "Hyderabad, Telangana", "₹58,500 – ₹63,000 / MT", "In Stock",
      "/images/metal-pipes.png", JSON.stringify(["/images/metal-pipes.png"]), 0, 195
    );

    insertListing.run(
      v4.lastInsertRowid, "product", "bio-petro-chemical", "bio-fuels-base-oils",
      "Industrial Bio-Diesel (B100) & Group II Base Oils",
      "industrial-biodiesel-b100-base-oil",
      "IS 15607 compliant biodiesel for industrial DG sets, boilers, furnaces, and fleet logistics.",
      "Clean-burning ASTM D6751 / IS 15607 certified B100 biofuel and virgin Group II SN150/SN500 base oils supplied in 210L HDPE drums or 20KL/24KL SS tanker loads with batch COA.",
      JSON.stringify({ "Flash Point": "> 130°C", "Calorific Value": "9,500 Kcal/Kg", "Sulfur Content": "< 10 ppm", "Delivery": "210L Drums / Bulk Tanker", "MOQ": "2,000 Liters" }),
      "Hyderabad, Telangana", "₹74 – ₹86 / Liter", "Ready Bulk Dispatch",
      "/images/refinery-plant.png", JSON.stringify(["/images/refinery-plant.png", "/images/hero-desktop-1.png"]), 1, 290
    );

    insertListing.run(
      v4.lastInsertRowid, "product", "bio-petro-chemical", "solvents-petrochemicals",
      "Industrial Bitumen VG30/VG40 & Hydrocarbon Solvents",
      "industrial-bitumen-vg30-solvents",
      "Refinery-grade paving bitumen, MTO, mixed xylene, and industrial furnace fuel oils for infrastructure & plants.",
      "Sourced directly from authorized refinery terminals with full weighbridge and quality lab certification. Reliable tanker scheduling for highway contractors, waterproofing manufacturers, and chemical formulators.",
      JSON.stringify({ "Grades": "VG-30, VG-40, MTO, Xylene", "Packaging": "MS Drums / Heated Tanker", "Purity": "99.2% Min", "Dispatch Time": "24–48 Hours", "MOQ": "10 Tons" }),
      "Visakhapatnam, Andhra Pradesh", "Request Quote", "In Stock",
      "/images/refinery-plant.png", JSON.stringify(["/images/refinery-plant.png"]), 0, 152
    );

    // Machineries
    insertListing.run(
      v1.lastInsertRowid, "machinery", "rubber-machineries", "mixing-mills-kneaders",
      "75L Dispersion Kneader & Two-Roll Rubber Mixing Mill Line",
      "75l-dispersion-kneader-rubber-mill",
      "Heavy-duty PLC-controlled pressurized rubber dispersion kneader paired with 18x48 inch chilled cast iron mixing mill.",
      "Engineered for continuous rubber compounding, silicone mixing, and masterbatch production. Equipped with hydraulic tilt-discharge, hard-faced rotors, automated temperature sensors, and Siemens/ABB VFD drive panels.",
      JSON.stringify({ "Batch Capacity": "75 Liters / 90 Kg", "Main Motor": "75 HP / 100 HP IE3", "Rotor Speed": "32 / 26 RPM", "Cooling": "Chilled Water Rotary Joint", "Warranty": "12 Months On-Site" }),
      "Pune, Maharashtra", "₹18,50,000 – ₹24,00,000", "Made to Order (4 Weeks)",
      "/images/cat-machineries.png", JSON.stringify(["/images/cat-machineries.png"]), 1, 276
    );

    insertListing.run(
      v2.lastInsertRowid, "machinery", "plastic-machineries", "injection-extrusion-lines",
      "250-Ton Servo Hydraulic Plastic Injection Molding Machine",
      "250t-servo-plastic-injection-molding",
      "Energy-saving servo-driven injection molding machine saving up to 55% power for crates, automotive & industrial parts.",
      "High-precision proportional hydraulic system with nitrided bi-metallic screw & barrel, European linear transducers, and 10-inch touchscreen PLC controller with 200-mold recipe memory.",
      JSON.stringify({ "Clamping Force": "250 Tons", "Shot Weight": "620 Grams (PS)", "Tie Bar Space": "560 x 560 mm", "Power Saving": "45%–55% Servo Motor", "Controller": "KEBA / Techmation PLC" }),
      "Ahmedabad, Gujarat", "₹22,75,000 + GST", "Ready for Inspection",
      "/images/machinery-injection-250t.png", JSON.stringify(["/images/machinery-injection-250t.png", "/images/plastic-granules.png", "/images/cat-machineries.png"]), 1, 310
    );

    insertListing.run(
      v3.lastInsertRowid, "machinery", "metals-plants", "furnaces-rolling-mills",
      "Turnkey 10 TPD Steel Tube Mill & Induction Melting Plant",
      "turnkey-steel-tube-mill-plant",
      "Complete high-frequency ERW pipe mill & medium-frequency induction furnace package with erection & commissioning.",
      "Includes uncoiler, leveling unit, forming stands, solid-state HF welder, sizing mill, flying saw cutoff, and automatic bundling line. Full operator training and turnkey commissioning across India.",
      JSON.stringify({ "Pipe OD Range": "12mm – 89mm", "Wall Thickness": "0.6mm – 4.0mm", "Line Speed": "Up to 80 m/min", "Power Source": "200 kW Solid State HF", "Installation": "Turnkey Included" }),
      "Hyderabad, Telangana", "₹65,00,000 Onwards", "Project Basis",
      "/images/metal-pipes.png", JSON.stringify(["/images/metal-pipes.png", "/images/cat-machineries.png"]), 1, 189
    );

    insertListing.run(
      v4.lastInsertRowid, "machinery", "bpc-plants", "distillation-pyrolysis-plants",
      "20 TPD Automated Bio-Diesel & Oil Distillation Plant",
      "20-tpd-biodiesel-distillation-plant",
      "Turnkey stainless steel fractional distillation & transesterification bio-refinery plant with SCADA automation.",
      "Designed for multi-feedstock oil processing (used cooking oil, palm fatty acid, crude vegetable oils) into EN 14214 / IS 15607 biodiesel with zero-liquid-discharge effluent recovery.",
      JSON.stringify({ "Plant Capacity": "10 – 50 TPD Modular", "Material": "SS 316L Contact Parts", "Automation": "Full PLC / SCADA", "Footprint": "1,200 Sq. Meters", "Compliance": "PESO & CPCB Norms" }),
      "Hyderabad, Telangana", "₹1.25 Cr – ₹2.80 Cr", "Turnkey Delivery (90 Days)",
      "/images/refinery-plant.png", JSON.stringify(["/images/refinery-plant.png", "/images/hero-desktop-1.png"]), 1, 241
    );

    insertListing.run(
      v3.lastInsertRowid, "machinery", "vehicle-fabrication", "tipper-tanker-bodies",
      "Heavy Commercial Tipper, Tanker & Container Body Fabrication",
      "heavy-tipper-tanker-body-fabrication",
      "Custom ARAI-compliant MS/SS tanker bodies, mining tipper boxes, and insulated cargo containers built to chassis specs.",
      "Precision CNC-bent Hardox/Mild Steel tipper bodies, 12KL–28KL PESO-approved chemical/fuel tankers, and refrigerated container bodies fitted on Tata, Ashok Leyland, BharatBenz, and Eicher chassis.",
      JSON.stringify({ "Body Material": "SAILMA 450 / SS 304 / Mild Steel", "Capacity": "14 Cu.M – 28 Cu.M", "Hydraulic Kit": "Hyva / Wipro Front-End", "Coating": "Epoxy Primer + PU Finish", "Turnaround": "12 – 18 Days" }),
      "Hyderabad, Telangana", "₹3,80,000 – ₹9,50,000", "Booking Open",
      "/images/cat-machineries.png", JSON.stringify(["/images/cat-machineries.png"]), 0, 174
    );

    // Services (All 8!)
    const servicesSeed = [
      ["manpower-services", "Industrial Skilled Manpower & Plant Staffing Services", "industrial-skilled-manpower-services", "Certified plant operators, TIG/MIG welders, electricians, fitters, and HSE safety officers deployed Pan-India.", "Complete statutory compliance (PF, ESIC, Labor License) with verified trade-tested industrial technicians for factories, refineries, and fabrication yards.", { "Deployment Time": "7 – 14 Days", "Compliance": "100% PF, ESIC & Safety PPE", "Categories": "Operators, Welders, Engineers, Helpers", "Coverage": "All Industrial Clusters in India" }, "Custom Contract", 1, "/images/service-manpower.png"],
      ["amc", "Comprehensive Industrial Plant & Utility AMC Services", "comprehensive-plant-amc-services", "Scheduled preventive & predictive Annual Maintenance Contracts for boilers, chillers, compressors, and molding lines.", "Zero-downtime industrial AMC packages including vibration analysis, thermography, OEM spare management, and 24/7 emergency breakdown callout SLAs.", { "Response SLA": "4 – 12 Hours On-Site", "Coverage": "Mechanical, Electrical & PLC", "Reporting": "Monthly Reliability Audit", "Contract Tenure": "1 – 5 Years" }, "From ₹1,20,000 / Year", 1, "/images/service-amc.png"],
      ["maintenance-services", "Shutdown & Breakdown Industrial Maintenance Services", "shutdown-breakdown-maintenance-services", "Rapid plant turnaround, boiler descaling, hydraulic cylinder reconditioning, and alignment services.", "Experienced millwright teams equipped with laser shaft alignment, torque wrenching, and NDT inspection tools to cut unplanned plant stoppages.", { "Availability": "24/7 Emergency Mobilization", "Specialties": "Hydraulics, Pneumatics, Boilers", "Team Size": "4 to 40 Technicians", "Safety": "ISO 45001 Permit-to-Work" }, "Project / Per-Visit", 0, "/images/service-maintenance.png"],
      ["mechanical-services", "Heavy Mechanical Fabrication, Piping & Erection", "heavy-mechanical-fabrication-piping", "IBR/Non-IBR process piping, structural steel sheds, storage tanks, and heavy machine erection.", "End-to-end mechanical execution from isometric drafting to hydro-testing and commissioning for chemical, polymer, and metal plants.", { "Standards": "ASME B31.3 / IBR / AWS D1.1", "Testing": "X-Ray, DP, Ultrasonic, Hydro", "Tonnage Capacity": "Up to 500 MT/Month", "Location": "On-Site & Workshop" }, "Request BoQ Quote", 1, "/images/service-mechanical.png"],
      ["logistics-services", "Industrial Bulk Freight, Tanker & ODC Logistics", "industrial-bulk-odc-logistics", "GPS-tracked FTL trailers, chemical tankers, and ODC hydraulic axles for heavy machinery & raw materials.", "Pan-India industrial transport connecting MIDC, GIDC, Jeedimetla, Peenya, and port terminals with transit insurance support.", { "Fleet Types": "32ft MXL, Flatbeds, SS Tankers, ODC", "Tracking": "Live GPS + E-Way Bill Support", "Routes": "All India Industrial Corridors", "Dispatch": "Same-Day Vehicle Placement" }, "Per-Trip / Contract", 0, "/images/service-logistics.png"],
      ["loans-services", "MSME Machinery Loans, Working Capital & Project Finance", "msme-machinery-loans-project-finance", "Facilitating term loans, CGTMSE collateral-free MSME credit, CC/OD limits, and invoice discounting.", "Dedicated industrial finance advisory connecting verified factories with leading PSU/private banks and NBFCs for rapid capex & working capital approvals.", { "Ticket Size": "₹10 Lakhs – ₹25 Crores", "Schemes": "CGTMSE, PMEGP, Machinery Term Loan", "Processing": "7 – 15 Working Days", "Conditions": "Conditions Apply • Check Customer Care" }, "Advisory / Zero Upfront", 0, "/images/service-loans.png"],
      ["business-registrations", "Industrial Business Registrations, GST & Factory Licensing", "business-registrations-gst-licensing", "Complete compliance setup: GST, Udyam MSME, Factory Plan Approval, PCB Consent, IEC, and ISO.", "One-stop regulatory desk for new plants and growing suppliers covering state & central industrial statutory registrations.", { "Turnaround": "3 – 21 Working Days", "Scope": "GST, MSME, PCB CFE/CFO, ISO, Trademark", "Support": "Dedicated Compliance Officer", "Conditions": "Conditions Apply" }, "Package Pricing", 0, "/images/service-registrations.svg"],
      ["website-app-services", "Industrial B2B Website, Catalog & Mobile App Development", "industrial-website-app-services", "Custom high-converting industrial websites, dealer portals, and inventory apps built for manufacturers.", "Modern responsive web & mobile engineering tailored for raw material suppliers and machinery OEMs with WhatsApp lead integration.", { "Deliverables": "Custom Web + Admin CMS + SEO", "Timeline": "2 – 4 Weeks", "Integrations": "WhatsApp, ERP, Payment Gateway", "Support": "1 Year Managed Hosting Option" }, "From ₹24,999", 0, "/images/service-webapp.svg"]
    ] as const;

    for (const s of servicesSeed) {
      insertListing.run(
        v4.lastInsertRowid, "service", s[0], "", s[1], s[2], s[3], s[4],
        JSON.stringify(s[5]), "Pan India (HQ: Hyderabad)", s[6], "Available Immediately",
        s[8], JSON.stringify([s[8]]), s[7], 130
      );
    }

    // 6. Seed Subscription Plans (Exact prompt specs!)
    const insertPlan = db.prepare(`
      INSERT INTO subscription_plans (
        name, slug, duration_months, bonus_months, price_inr, gst_included,
        badge_text, highlight_text, features, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 1, ?)
    `);

    insertPlan.run(
      "6 Months Starter", "6-months", 6, 0, 6000,
      "Starter", "6 Months Full Portal Access • Incl. 18% GST",
      JSON.stringify([
        "Unlimited access to verified vendor contacts & WhatsApp connect",
        "Priority Real-Time Business Opportunity alerts",
        "Chartered Accountant advice on call (Conditions Apply)",
        "Dedicated customer support & verified buyer badge"
      ]), 1
    );

    insertPlan.run(
      "12 Months Growth", "12-months", 12, 0, 11000,
      "Popular", "12 Months Full Portal Access • Incl. 18% GST",
      JSON.stringify([
        "Everything in 6 Months Starter + higher savings",
        "Priority listing placement in search results",
        "Business GST monthly return filing support (Conditions Apply)",
        "WhatsApp real-time lead notifications for your categories"
      ]), 2
    );

    insertPlan.run(
      "2 Years Enterprise", "2-years", 24, 0, 20000,
      "Best Value", "24 Months Full Portal Access • Incl. 18% GST",
      JSON.stringify([
        "All Growth features for 24 full months",
        "Chartered Accountant advice + GST & Annual IT filing support*",
        "Featured Vendor / Buyer spotlight on category pages",
        "Dedicated account manager & referral rewards"
      ]), 3
    );

    insertPlan.run(
      "3 Years + 4th Year FREE", "3-years-launch-offer", 36, 12, 35000,
      "LAUNCH OFFER • 4th YEAR FREE", "Pay for 3 Years, Get 4th Year (12 Months) FREE! • Incl. 18% GST",
      JSON.stringify([
        "48 Months total validity (3 Years + 4th Year FREE Offer!)",
        "Maximum Launching Offer discount for paid subscribers",
        "CA Advice on Call + Monthly GST & Annual IT Return Filing*",
        "Top homepage & category banner promotion priority",
        "Free unlimited verified product/machinery/service listings"
      ]), 4
    );

    // 7. Seed Requirements (Real-Time Business Portal)
    const insertReq = db.prepare(`
      INSERT INTO requirements (
        user_id, name, business_name, mobile, whatsapp, email,
        category_type, category_slug, title, quantity, location,
        description, status, matched_vendors_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?)
    `);

    insertReq.run(
      custPaid.lastInsertRowid, "Karan Malhotra", "Apex Industrial Packaging", "9811223344", "919811223344", "karan@apexmanufacturing.in",
      "product", "rubber", "Urgent Requirement: 8 MT EPDM Industrial Rubber Sheets (6mm)", "8 Metric Tons", "NCR / Faridabad, Haryana",
      "Looking for consistent monthly supply of 6mm Shore 60A EPDM sheets with test certificate. Immediate PO upon sample approval.", 1
    );

    insertReq.run(
      custPaid.lastInsertRowid, "Ramesh Gupta", "Navbharat Pipes & Fittings", "9822334455", "919822334455", "ramesh@navbharatpipes.in",
      "product", "plastic", "Need 15 MT Virgin HDPE Pipe Grade PE100 Granules", "15 Metric Tons", "Indore, Madhya Pradesh",
      "Require natural/black PE100 HDPE granules for pressurized irrigation pipe extrusion. Ready payment terms.", 1
    );

    insertReq.run(
      null, "Suresh Reddy", "Deccan Infra Projects", "9849055667", "919849055667", "suresh@deccaninfra.in",
      "machinery", "bpc-plants", "Quotation for 15 TPD Bio-Diesel Distillation Unit", "1 Complete Plant", "Vijayawada, Andhra Pradesh",
      "Seeking turnkey proposal including civil foundation specs, SS316 reactors, SCADA panel, and pollution board compliance assistance.", 1
    );

    insertReq.run(
      null, "Meera Nair", "Cochin Marine Engineering", "9895443322", "919895443322", "meera@cochinmarine.in",
      "service", "amc", "Annual Maintenance Contract for 3 Hydraulic Presses & Compressors", "1 Year Contract", "Kochi, Kerala",
      "Need qualified preventive maintenance partner with monthly inspection reports and 6-hour breakdown response.", 1
    );

    // 8. Seed Sample WhatsApp Notifications
    const insertWa = db.prepare(`
      INSERT INTO whatsapp_notifications (requirement_id, vendor_id, vendor_name, vendor_whatsapp, category_slug, message_preview, status)
      VALUES (?, ?, ?, ?, ?, ?, 'sent')
    `);
    insertWa.run(1, v1.lastInsertRowid, "Bharat Elastomers & Rubber Co.", "919820112233", "rubber", "New Business Opportunity Available: A relevant Rubber requirement (8 MT EPDM Sheets - Faridabad) has been posted on RAWMET.com.", );
    insertWa.run(2, v2.lastInsertRowid, "Shree Sai Polymers & Granules", "919845098765", "plastic", "New Business Opportunity Available: A relevant Plastic requirement (15 MT HDPE PE100 - Indore) has been posted on RAWMET.com.");
    insertWa.run(3, v4.lastInsertRowid, "Sriñidhi Industrial Engineering & Services", "919848011223", "bpc-plants", "New Business Opportunity Available: A relevant BPC Plant requirement (15 TPD Bio-Diesel Unit - Vijayawada) has been posted on RAWMET.com.");

    // 9. Seed Gallery Items
    const insertGallery = db.prepare(`
      INSERT INTO gallery_items (title, category, image_url, caption, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertGallery.run("Petrochemical & Bio-Refinery Complex", "Bio Petro Chemical", "/images/refinery-plant.png", "High-capacity distillation columns and continuous bio-petrochemical processing facility.", 1);
    insertGallery.run("Industrial Rubber Rolls & Heavy OTR Tyres", "Rubber", "/images/rubber-roll.png", "Precision-calendered EPDM rubber conveyor rolls and industrial elastomers.", 2);
    insertGallery.run("HDPE & PP Polymer Granules", "Plastic", "/images/plastic-granules.png", "Virgin & compounded engineering polymer pellets ready for bulk dispatch.", 3);
    insertGallery.run("Seamless Stainless Steel Pipes & Tubes", "Metals", "/images/metal-pipes.png", "ASTM-certified SS304/316 industrial seamless piping and structural alloys.", 4);
    insertGallery.run("Hydraulic Injection & Extrusion Machinery", "Machineries", "/images/cat-machineries.png", "Automated industrial molding and compounding machinery units.", 5);
    insertGallery.run("Certified Plant Engineering & Maintenance", "Services", "/images/cat-services.png", "Skilled industrial manpower, HSE supervision, and turnkey plant AMC.", 6);

    // 10. Seed Dynamic Site Content (CMS)
    const heroSlides: HeroSlide[] = [
      {
        id: "slide-1",
        eyebrow: "Online Real-time Business Portal",
        headlinePrefix: "Your Trusted Platform for\nIndustrial Business",
        headlineHighlight: "Solutions",
        subcategoriesLine: "Products  |  Machineries  |  Services",
        desktopImage: "/images/hero-desktop-1.png",
        mobileImage: "/images/hero-mobile-1.png",
        ctaLabel: "Explore Marketplace",
        ctaHref: "/products",
      },
      {
        id: "slide-2",
        eyebrow: "Verified Multi-Vendor Industrial Supply",
        headlinePrefix: "Bulk Raw Materials &\nPolymer",
        headlineHighlight: "Supply",
        subcategoriesLine: "Rubber  |  Plastic  |  Metals  |  Bio Petro Chemical",
        desktopImage: "/images/plastic-granules.png",
        mobileImage: "/images/hero-mobile-1.png",
        ctaLabel: "Browse Products",
        ctaHref: "/products",
      },
      {
        id: "slide-3",
        eyebrow: "Turnkey Plants & Heavy Equipment",
        headlinePrefix: "Industrial Plants &\nModern",
        headlineHighlight: "Machineries",
        subcategoriesLine: "Rubber  |  Plastic  |  Metals Plants  |  BPC Plants  |  Fabrication",
        desktopImage: "/images/refinery-plant.png",
        mobileImage: "/images/hero-mobile-1.png",
        ctaLabel: "View Machineries",
        ctaHref: "/machineries",
      },
      {
        id: "slide-4",
        eyebrow: "Real-Time Business Opportunities",
        headlinePrefix: "Direct Enquiries &\nInstant",
        headlineHighlight: "Connections",
        subcategoriesLine: "Find Requirements  |  Post Requirements  |  WhatsApp Alerts",
        desktopImage: "/images/metal-pipes.png",
        mobileImage: "/images/hero-mobile-1.png",
        ctaLabel: "Post Requirement",
        ctaHref: "/requirements",
      },
    ];

    const aboutContent: AboutContent = {
      headline: "About Sriñidhi Enterprises",
      subheadline: "Connecting Industrial India through RAWMET.com — Online Real-time Business Portal",
      summary:
        "A leading multi-vendor platform for Rubber, Plastic, Metals and Bio Petro Chemical industries. We connect businesses with trusted vendors and provide real-time business opportunities.",
      fullStory:
        "Operated by Sriñidhi Enterprises, RAWMET.com is built specifically for India's industrial manufacturing ecosystem. From raw polymers, natural & synthetic rubber, stainless steel alloys, and bio-petrochemicals to turnkey industrial plants and essential plant services, our portal eliminates middlemen friction by verifying every supplier via GST / authentic business ID and matching real-time buyer requirements directly to eligible vendors via instant WhatsApp and dashboard alerts.",
      mission:
        "To empower MSMEs, manufacturers, fabricators, and industrial buyers across India with transparent, GST-verified sourcing, free verified listings, and real-time trade matchmaking.",
      vision:
        "To become India's most trusted real-time B2B industrial marketplace uniting raw materials, industrial machineries, technical services, and business compliance support on one digital backbone.",
      imageUrl: "/images/refinery-plant.png",
      stats: [
        { key: "listings", target: 10000, suffix: "+", label: "Business Listings", icon: "users" },
        { key: "customers", target: 5000, suffix: "+", label: "Happy Customers", icon: "handshake" },
        { key: "trusted", target: 100, suffix: "%", label: "Trusted Platform", icon: "shield" },
        { key: "support", target: 24, suffix: "/7", label: "Support", icon: "clock" },
      ],
    };

    const launchingOffer: LaunchingOfferContent = {
      badge: "Launching Offer",
      title: "Launching Offer",
      subtitle: "Get Special Discounts for Paid Subscribers!",
      ctaText: "Subscribe Now",
      fourthYearFreeNote: "3 Years Plan (₹35,000 incl. 18% GST) + 4th Year FREE Offer!",
      highlights: [
        "Special Launch Discounts for Paid Customers",
        "Chartered Accountant Advice on Call*",
        "GST Monthly & Annual IT Return Filing Support*",
        "Priority Real-Time Business Opportunity Alerts",
      ],
    };

    const contactSettings: ContactSettings = {
      companyName: "Sriñidhi Enterprises",
      portalName: "RAWMET.com",
      mobile: "+91 7382177653",
      whatsapp: "917382177653",
      email: "support@rawmet.com",
      address: "Hyderabad, Telangana, India — Serving Industrial Clusters Pan-India",
      gstNumber: "36AABCS4411P1Z8",
      referralRewardRule: "Refer a vendor who activates a paid subscription and earn 10% referral reward credit or subscription extension bonus (Conditions Apply).",
      conditionsApplyNote: "Conditions Apply • Check with Customer Care (+91 7382177653)",
    };

    const businessSupport = [
      {
        id: "ca-advice",
        title: "Chartered Accountant Advice",
        subtitle: "Advice on call for business improvement",
        description:
          "Paid subscribers gain priority access to scheduled telephonic consultations with experienced Chartered Accountants for working capital planning, tax structuring, and MSME compliance.",
        badge: "Paid Subscriber Benefit",
        conditions: "Conditions Apply • Check with Customer Care",
      },
      {
        id: "gst-filing",
        title: "GST Return Filing",
        subtitle: "Business GST monthly return filing",
        description:
          "Streamlined monthly GST return filing coordination (GSTR-1 / GSTR-3B) facilitated through our empaneled tax professionals so industrial owners stay focused on production.",
        badge: "Business Support Service",
        conditions: "Conditions Apply • Check with Customer Care",
      },
      {
        id: "it-filing",
        title: "Annual IT Return Filing",
        subtitle: "Annual Income Tax return filing",
        description:
          "Annual Income Tax return preparation and filing assistance for proprietorships, partnerships, and industrial MSMEs covered under eligible paid subscription tiers.",
        badge: "Annual Compliance",
        conditions: "Conditions Apply • Check with Customer Care",
      },
    ];

    const insertCms = db.prepare(`INSERT INTO site_content (key, value) VALUES (?, ?)`);
    insertCms.run("hero_slides", JSON.stringify(heroSlides));
    insertCms.run("about_content", JSON.stringify(aboutContent));
    insertCms.run("launching_offer", JSON.stringify(launchingOffer));
    insertCms.run("contact_settings", JSON.stringify(contactSettings));
    insertCms.run("business_support", JSON.stringify(businessSupport));

    db.exec("COMMIT");
    globalThis.__rawmetSeeded = true;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

function syncUpdatedMedia(db: ReturnType<typeof getDb>): void {
  const listingUpdates: Array<[string, string, string[]]> = [
    ["heavy-mechanical-fabrication-piping", "/images/service-mechanical.png", ["/images/service-mechanical.png"]],
    ["comprehensive-plant-amc-services", "/images/service-amc.png", ["/images/service-amc.png"]],
    ["industrial-skilled-manpower-services", "/images/service-manpower.png", ["/images/service-manpower.png"]],
    ["shutdown-breakdown-maintenance-services", "/images/service-maintenance.png", ["/images/service-maintenance.png"]],
    ["industrial-bulk-odc-logistics", "/images/service-logistics.png", ["/images/service-logistics.png"]],
    ["msme-machinery-loans-project-finance", "/images/service-loans.png", ["/images/service-loans.png"]],
    ["business-registrations-gst-licensing", "/images/service-registrations.svg", ["/images/service-registrations.svg"]],
    ["industrial-website-app-services", "/images/service-webapp.svg", ["/images/service-webapp.svg"]],
    [
      "250t-servo-plastic-injection-molding",
      "/images/machinery-injection-250t.png",
      ["/images/machinery-injection-250t.png", "/images/plastic-granules.png", "/images/cat-machineries.png"],
    ],
  ];

  const stmtListing = db.prepare(`UPDATE listings SET image_url = ?, gallery_urls = ? WHERE slug = ?`);
  for (const [slug, img, gallery] of listingUpdates) {
    stmtListing.run(img, JSON.stringify(gallery), slug);
  }

  const catUpdates: Array<[string, string]> = [
    ["rubber", "/images/cat-thumb-rubber.png"],
    ["plastic", "/images/cat-thumb-plastic.png"],
    ["metals", "/images/cat-thumb-metals.png"],
    ["bio-petro-chemical", "/images/cat-thumb-bpc.png"],
    ["manpower-services", "/images/service-manpower.png"],
    ["amc", "/images/service-amc.png"],
    ["maintenance-services", "/images/service-maintenance.png"],
    ["mechanical-services", "/images/service-mechanical.png"],
    ["logistics-services", "/images/service-logistics.png"],
    ["loans-services", "/images/service-loans.png"],
    ["business-registrations", "/images/service-registrations.svg"],
    ["website-app-services", "/images/service-webapp.svg"],
    ["plastic-machineries", "/images/machinery-injection-250t.png"],
  ];

  const stmtCat = db.prepare(`UPDATE categories SET image_url = ? WHERE slug = ?`);
  for (const [slug, img] of catUpdates) {
    stmtCat.run(img, slug);
  }
}

