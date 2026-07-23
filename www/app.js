// JSS Engineering Works & Invoice Generator Application Logic

// Application State
let invoiceState = {
    seller: {
        name: "JAFFAR SHAREEF",
        address: "WARD NO-18, ATP ROAD, JANATHA NAGAR, BALLARI-583101",
        state: "KARNATAKA",
        stateCode: "KA",
        pan: "AAHPZ8535G",
        copyLabel: "ORIGINAL FOR RECEIPMENT"
    },
    client: {
        name: "",
        address: "",
        gstin: "",
        date: ""
    },
    items: [
        { desc: "", qty: "", unit: "", rate: "", amount: "" }
    ],
    advance: 0,
    wordsOverride: ""
};

// Initialization
function initApplication() {
    try {
        // Default: load empty invoice structure or sample data
        resetInvoiceForm();
        
        // Set current date as default date in input
        const today = new Date();
        const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear().toString().slice(-2)}`;
        
        const dateInput = document.getElementById("invoice-date");
        if (dateInput) {
            dateInput.value = formattedDate;
            invoiceState.client.date = formattedDate;
        }
        
        const pDate = document.getElementById("p-invoice-date");
        if (pDate) {
            pDate.innerText = formattedDate;
        }

        // Render initial state
        updateInvoicePreview();
    } catch (e) {
        console.error("Initialization error:", e);
        // Show error visually
        const errDiv = document.createElement("div");
        errDiv.style.color = "red";
        errDiv.style.padding = "20px";
        errDiv.style.background = "#ffebee";
        errDiv.style.border = "1px solid red";
        errDiv.style.position = "fixed";
        errDiv.style.top = "10px";
        errDiv.style.left = "10px";
        errDiv.style.zIndex = "10000";
        errDiv.innerText = "Error initializing app: " + e.message;
        document.body.appendChild(errDiv);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApplication);
} else {
    // DOM is already ready
    initApplication();
}

// Switch view tabs (Home, Services, Contact, Billing)
function switchTab(tabId) {
    // Update menu links
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        if (link.getAttribute("href") === `#${tabId}`) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Update tab panels
    const tabs = document.querySelectorAll(".tab-content");
    tabs.forEach(tab => {
        if (tab.id === `${tabId}-section`) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Collapsible editor card toggle
function toggleCardBody(headerElement) {
    const card = headerElement.closest(".editor-card");
    card.classList.toggle("collapsed");
}

// Mobile navigation menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector(".nav-links");
    nav.classList.toggle("mobile-active");
    if (nav.classList.contains("mobile-active")) {
        nav.style.display = "flex";
        nav.style.flexDirection = "column";
        nav.style.position = "absolute";
        nav.style.top = "76px";
        nav.style.left = "0";
        nav.style.right = "0";
        nav.style.background = "rgba(10, 10, 12, 0.95)";
        nav.style.padding = "20px";
        nav.style.borderBottom = "1px solid var(--border-color)";
    } else {
        nav.style.display = "";
    }
}

// Add a new row of service item to state and render it
function addNewItemRow() {
    invoiceState.items.push({ desc: "", qty: "", unit: "", rate: "", amount: "" });
    renderItemsEditor();
    updateInvoicePreview();
}

// Delete item row
function deleteItemRow(index) {
    if (invoiceState.items.length > 1) {
        invoiceState.items.splice(index, 1);
    } else {
        // Just clear the single row
        invoiceState.items[0] = { desc: "", qty: "", unit: "", rate: "", amount: "" };
    }
    renderItemsEditor();
    calculateInvoiceValues();
}

// Handles input changes inside dynamic line items
function handleItemFieldChange(index, field, value) {
    const item = invoiceState.items[index];
    item[field] = value;
    
    // Auto-calculate amount if Qty and Rate are provided
    if (field === 'qty' || field === 'rate') {
        const qtyNum = parseFloat(item.qty);
        const rateNum = parseFloat(item.rate);
        
        if (!isNaN(qtyNum) && !isNaN(rateNum)) {
            item.amount = (qtyNum * rateNum).toFixed(0); // integer rounding to match sample
            
            // Update the amount input in DOM directly to keep cursor focus intact
            const amountInput = document.getElementById(`item-amount-${index}`);
            if (amountInput) amountInput.value = item.amount;
        }
    }
    
    calculateInvoiceValues();
}

// Generate the item editors in left panel
function renderItemsEditor() {
    const container = document.getElementById("items-editor-container");
    container.innerHTML = "";
    
    invoiceState.items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "item-editor-row";
        row.innerHTML = `
            <div class="item-editor-row-top">
                <div class="item-desc">
                    <label>Description of Service</label>
                    <input type="text" value="${item.desc}" placeholder="e.g. SQURE TUBE" oninput="handleItemFieldChange(${index}, 'desc', this.value)">
                </div>
                <button class="item-delete-btn" onclick="deleteItemRow(${index})" title="Delete row">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="item-editor-row-bottom">
                <div class="item-qty">
                    <label>Qty</label>
                    <input type="text" value="${item.qty}" placeholder="e.g. 5272" oninput="handleItemFieldChange(${index}, 'qty', this.value)">
                </div>
                <div class="item-unit">
                    <label>Unit</label>
                    <input type="text" value="${item.unit}" placeholder="e.g. kg / sq.m" oninput="handleItemFieldChange(${index}, 'unit', this.value)">
                </div>
                <div class="item-rate">
                    <label>Rate (₹)</label>
                    <input type="number" value="${item.rate}" placeholder="26" oninput="handleItemFieldChange(${index}, 'rate', this.value)">
                </div>
                <div class="item-amount">
                    <label>Amount (₹)</label>
                    <input type="number" id="item-amount-${index}" value="${item.amount}" placeholder="Auto" oninput="handleItemFieldChange(${index}, 'amount', this.value)">
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

// Format numbers to Indian Numbering format (Lakhs, Thousands)
// e.g., 258652 -> 2,58,652
function formatIndianCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return "0";
    let x = Math.round(num).toString();
    
    // Handle negatives
    let isNegative = false;
    if (x.startsWith('-')) {
        isNegative = true;
        x = x.substring(1);
    }
    
    let lastThree = x.substring(x.length - 3);
    let otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
    }
    let res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return (isNegative ? '-' : '') + res;
}

// Convert numbers into Indian words notation
// e.g., 168652 -> One Lakh Sixty-Eight Thousand Six Hundred Fifty-Two only
function numberToIndianWords(num) {
    if (num === 0) return "Zero Rupees Only";
    if (isNaN(num) || num < 0) return "";
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function numToWords(n, suffix) {
        let str = "";
        if (n > 19) {
            str += b[Math.floor(n / 10)] + " " + a[n % 10];
        } else {
            str += a[n];
        }
        if (n) {
            str += suffix;
        }
        return str;
    }
    
    let words = "";
    
    // Crores (10,000,000)
    words += numToWords(Math.floor(num / 10000000), "Crore ");
    
    // Lakhs (100,000)
    words += numToWords(Math.floor((num / 100000) % 100), "Lakh ");
    
    // Thousands (1,000)
    words += numToWords(Math.floor((num / 1000) % 100), "Thousand ");
    
    // Hundreds (100)
    words += numToWords(Math.floor((num / 100) % 10), "Hundred ");
    
    // Tens & Ones
    let rem = num % 100;
    if (rem > 0) {
        if (words !== "") {
            words += "and ";
        }
        if (rem > 19) {
            // Apply hyphen for clean typography where needed, e.g. Sixty-Eight
            const tenStr = b[Math.floor(rem / 10)];
            const unitStr = a[rem % 10].trim();
            words += unitStr ? `${tenStr}-${unitStr} ` : `${tenStr} `;
        } else {
            words += a[rem];
        }
    }
    
    words = words.trim().replace(/\s+/g, ' ');
    
    if (words) {
        // Standard capitalization
        return words.charAt(0).toUpperCase() + words.slice(1) + " only......";
    }
    return "";
}

// Calculate the grand total, advance, balance, and word translation
function calculateInvoiceValues() {
    // Read state from input fields where necessary
    const advVal = parseFloat(document.getElementById("advance-amount").value);
    invoiceState.advance = isNaN(advVal) ? 0 : advVal;
    
    // Sum amounts
    let total = 0;
    invoiceState.items.forEach(item => {
        const amt = parseFloat(item.amount);
        if (!isNaN(amt)) {
            total += amt;
        }
    });
    
    const balance = total - invoiceState.advance;
    
    // Update live brief values in form
    document.getElementById("brief-subtotal").innerText = "₹" + formatIndianCurrency(total);
    document.getElementById("brief-advance").innerText = "₹" + formatIndianCurrency(invoiceState.advance);
    document.getElementById("brief-balance").innerText = "₹" + formatIndianCurrency(balance);
    
    // Update actual printable labels
    document.getElementById("p-total-amount").innerText = formatIndianCurrency(total);
    document.getElementById("p-advance-amount").innerText = formatIndianCurrency(invoiceState.advance);
    document.getElementById("p-balance-amount").innerText = formatIndianCurrency(balance);
    
    // Update Amount In Words
    const wordsEl = document.getElementById("p-amount-words");
    if (invoiceState.wordsOverride) {
        wordsEl.innerText = invoiceState.wordsOverride;
    } else {
        // Default to balance words translation
        wordsEl.innerText = numberToIndianWords(balance);
    }
    
    // Mirror items to invoice preview table
    renderItemsPreview();
}

// Handle manual override of Amount in Words
function overrideWords() {
    const val = document.getElementById("amount-words-override").value;
    invoiceState.wordsOverride = val;
    calculateInvoiceValues();
}

// Render the right panel's printable table rows
function renderItemsPreview() {
    const tbody = document.getElementById("p-items-tbody");
    tbody.innerHTML = "";
    
    // Determine how many items we have, and we want to draw at least 7 rows total
    // to match the structural padding of the original document.
    const minRows = 7;
    const itemsCount = invoiceState.items.length;
    const rowsToDraw = Math.max(minRows, itemsCount);
    
    for (let i = 0; i < rowsToDraw; i++) {
        const item = invoiceState.items[i];
        const tr = document.createElement("tr");
        
        if (item && (item.desc || item.qty || item.rate || item.amount)) {
            // Populate row with item values
            const qtyText = item.qty ? `${item.qty} ${item.unit}` : "";
            const rateText = item.rate ? formatIndianCurrency(item.rate) : "";
            const amtText = item.amount ? formatIndianCurrency(item.amount) : "";
            
            tr.innerHTML = `
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${i + 1}</td>
                <td class="border-right border-bottom font-bold text-center" style="font-size: 11px; text-transform: uppercase;">${item.desc}</td>
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${qtyText}</td>
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${rateText}</td>
                <td class="border-bottom text-right font-bold" style="font-size: 11px; padding-right: 8px;">${amtText}</td>
            `;
        } else {
            // Draw empty filler row
            tr.innerHTML = `
                <td class="border-right border-bottom text-center"></td>
                <td class="border-right border-bottom"></td>
                <td class="border-right border-bottom"></td>
                <td class="border-right border-bottom"></td>
                <td class="border-bottom"></td>
            `;
        }
        tbody.appendChild(tr);
    }
}

// Mirror other textual forms (sender, client metadata) to the preview elements
function updateInvoicePreview() {
    // 1. Sender
    const sName = document.getElementById("seller-name").value;
    const sAddr = document.getElementById("seller-address").value;
    const sState = document.getElementById("seller-state").value;
    const sStateCode = document.getElementById("seller-state-code").value;
    const sPan = document.getElementById("seller-pan").value;
    const sLabel = document.getElementById("invoice-copy-label").value;

    document.getElementById("p-seller-name").innerText = sName;
    document.getElementById("p-seller-address").innerText = sAddr;
    document.getElementById("p-seller-state").innerText = sState;
    document.getElementById("p-seller-state-code").innerText = sStateCode;
    document.getElementById("p-seller-pan").innerText = sPan;
    document.getElementById("p-copy-label").innerText = sLabel;

    // 2. Client
    const cName = document.getElementById("client-name").value;
    const cAddr = document.getElementById("client-address").value;
    const cGstin = document.getElementById("client-gstin").value;
    const cDate = document.getElementById("invoice-date").value;

    document.getElementById("p-client-name").innerText = cName ? cName : "CLIENT NAME";
    document.getElementById("p-client-address").innerText = cAddr ? cAddr : "CLIENT ADDRESS DETAIL";
    document.getElementById("p-client-gstin").innerText = cGstin;
    document.getElementById("p-invoice-date").innerText = cDate;
    
    calculateInvoiceValues();
}

// Fills out the forms with the exact details from the user's uploaded bill image
function loadSampleInvoice() {
    // Populate client details
    document.getElementById("client-name").value = "KATARIYA MOVERS";
    document.getElementById("client-address").value = "PLOT No. 39, GHORPADE NAGAR, BEHIND BPCL PETROL PUMP, HOSPET-BALLARI MAIN ROAD, TORANAGALLU-583 123";
    document.getElementById("client-gstin").value = "";
    document.getElementById("invoice-date").value = "11.7.26";
    document.getElementById("advance-amount").value = 90000;
    document.getElementById("amount-words-override").value = ""; // let it auto calculate
    invoiceState.wordsOverride = "";

    // Populate items array
    invoiceState.items = [
        { desc: "SQURE TUBE", qty: "5272", unit: "kg", rate: "26", amount: "137072" },
        { desc: "ANGAL BOX", qty: "1980", unit: "kg", rate: "22", amount: "43500" },
        { desc: "SHEETING", qty: "678", unit: "sq.m", rate: "90", amount: "61020" },
        { desc: "FLASING", qty: "150", unit: "sq.m", rate: "80", amount: "12000" },
        { desc: "AUTO CHARGE", qty: "", unit: "", rate: "", amount: "1500" },
        { desc: "BOLT & NUT'S", qty: "", unit: "", rate: "", amount: "3500" }
    ];

    // Re-render
    renderItemsEditor();
    updateInvoicePreview();
}

// Reset invoice form and clear state
function resetInvoiceForm() {
    document.getElementById("client-name").value = "";
    document.getElementById("client-address").value = "";
    document.getElementById("client-gstin").value = "";
    
    const today = new Date();
    const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear().toString().slice(-2)}`;
    document.getElementById("invoice-date").value = formattedDate;
    
    document.getElementById("advance-amount").value = 0;
    document.getElementById("amount-words-override").value = "";
    invoiceState.wordsOverride = "";
    
    invoiceState.items = [
        { desc: "", qty: "", unit: "", rate: "", amount: "" }
    ];

    renderItemsEditor();
    updateInvoicePreview();
}

// Trigger Print action
function triggerPrint() {
    window.print();
}
