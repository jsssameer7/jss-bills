// ============================================================
// JSS ENGINEERING WORKS - BILL GENERATOR JAVASCRIPT ENGINE
// ============================================================

// Global Bill State
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

// ============================================================
// INITIALIZATION
// ============================================================
function initApplication() {
    try {
        // Set current date
        const today = new Date();
        const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear().toString().slice(-2)}`;
        
        const dateInput = document.getElementById("invoice-date");
        if (dateInput) {
            dateInput.value = formattedDate;
            invoiceState.client.date = formattedDate;
        }
        
        const pDate = document.getElementById("p-invoice-date");
        if (pDate) pDate.innerText = formattedDate;

        // Load sample invoice immediately on first open so user sees working bill!
        loadSampleInvoice();
        
        console.log("JSS Bill Generator initialized successfully.");
    } catch (err) {
        console.error("Init Error:", err);
    }
}

// Run immediately or on DOM ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApplication);
} else {
    initApplication();
}

// ============================================================
// TAB & MOBILE VIEW SWITCHING
// ============================================================
function switchMainTab(tabId) {
    const panels = document.querySelectorAll(".main-tab-panel");
    panels.forEach(p => p.classList.remove("active"));
    
    const targetPanel = document.getElementById(`${tabId}-section`);
    if (targetPanel) targetPanel.classList.add("active");

    const tabBtns = document.querySelectorAll(".nav-tab-btn");
    tabBtns.forEach(btn => btn.classList.remove("active"));
    
    const targetBtn = document.getElementById(`tab-btn-${tabId}`);
    if (targetBtn) targetBtn.classList.add("active");

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setMobileView(view) {
    const btnEditor = document.getElementById("btn-show-editor");
    const btnPreview = document.getElementById("btn-show-preview");

    if (view === 'preview') {
        document.body.classList.add("show-preview-mode");
        if (btnEditor) btnEditor.classList.remove("active");
        if (btnPreview) btnPreview.classList.add("active");
    } else {
        document.body.classList.remove("show-preview-mode");
        if (btnEditor) btnEditor.classList.add("active");
        if (btnPreview) btnPreview.classList.remove("active");
    }
}

function toggleCard(headEl) {
    const card = headEl.closest(".form-card");
    if (card) {
        card.classList.toggle("collapsed");
    }
}

// ============================================================
// DYNAMIC ITEM ROWS MANAGEMENT
// ============================================================
function addNewItemRow() {
    invoiceState.items.push({ desc: "", qty: "", unit: "", rate: "", amount: "" });
    renderItemsEditor();
    updateInvoicePreview();
    
    // Focus the new row's description input
    setTimeout(() => {
        const inputs = document.querySelectorAll(".item-edit-row input[type='text']");
        if (inputs.length > 0) {
            inputs[inputs.length - 3].focus();
        }
    }, 50);
}

function deleteItemRow(index) {
    if (invoiceState.items.length > 1) {
        invoiceState.items.splice(index, 1);
    } else {
        invoiceState.items[0] = { desc: "", qty: "", unit: "", rate: "", amount: "" };
    }
    renderItemsEditor();
    calculateInvoiceValues();
}

function handleItemFieldChange(index, field, value) {
    const item = invoiceState.items[index];
    if (!item) return;
    
    item[field] = value;

    // Auto calculate if qty and rate are numeric
    if (field === 'qty' || field === 'rate') {
        const qtyNum = parseFloat(item.qty);
        const rateNum = parseFloat(item.rate);

        if (!isNaN(qtyNum) && !isNaN(rateNum)) {
            item.amount = Math.round(qtyNum * rateNum).toString();
            const amtInput = document.getElementById(`item-amount-${index}`);
            if (amtInput) amtInput.value = item.amount;
        }
    }

    calculateInvoiceValues();
}

function renderItemsEditor() {
    const container = document.getElementById("items-editor-container");
    if (!container) return;
    
    container.innerHTML = "";

    invoiceState.items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "item-edit-row";
        row.innerHTML = `
            <div class="item-top">
                <input type="text" value="${item.desc}" placeholder="Description (e.g. SQURE TUBE)" oninput="handleItemFieldChange(${index}, 'desc', this.value)">
                <button class="btn-del-item" onclick="deleteItemRow(${index})" title="Remove item">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <div class="item-bottom">
                <div>
                    <label>Qty</label>
                    <input type="text" value="${item.qty}" placeholder="5272" oninput="handleItemFieldChange(${index}, 'qty', this.value)">
                </div>
                <div>
                    <label>Unit</label>
                    <input type="text" value="${item.unit}" placeholder="kg / sq.m" oninput="handleItemFieldChange(${index}, 'unit', this.value)">
                </div>
                <div>
                    <label>Rate (₹)</label>
                    <input type="number" value="${item.rate}" placeholder="26" oninput="handleItemFieldChange(${index}, 'rate', this.value)">
                </div>
                <div>
                    <label>Amount (₹)</label>
                    <input type="number" id="item-amount-${index}" value="${item.amount}" placeholder="Auto" oninput="handleItemFieldChange(${index}, 'amount', this.value)">
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

// ============================================================
// INDIAN FORMAT NUMBER & WORDS CONVERSION
// ============================================================
function formatIndianCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return "0";
    let x = Math.round(num).toString();
    
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
        if (n) str += suffix;
        return str;
    }
    
    let words = "";
    words += numToWords(Math.floor(num / 10000000), "Crore ");
    words += numToWords(Math.floor((num / 100000) % 100), "Lakh ");
    words += numToWords(Math.floor((num / 1000) % 100), "Thousand ");
    words += numToWords(Math.floor((num / 100) % 10), "Hundred ");
    
    let rem = num % 100;
    if (rem > 0) {
        if (words !== "") words += "and ";
        if (rem > 19) {
            const tenStr = b[Math.floor(rem / 10)];
            const unitStr = a[rem % 10].trim();
            words += unitStr ? `${tenStr}-${unitStr} ` : `${tenStr} `;
        } else {
            words += a[rem];
        }
    }
    
    words = words.trim().replace(/\s+/g, ' ');
    if (words) {
        return words.charAt(0).toUpperCase() + words.slice(1) + " only......";
    }
    return "";
}

// ============================================================
// CALCULATIONS & LIVE PREVIEW UPDATES
// ============================================================
function calculateInvoiceValues() {
    const advInput = document.getElementById("advance-amount");
    const advVal = advInput ? parseFloat(advInput.value) : 0;
    invoiceState.advance = isNaN(advVal) ? 0 : advVal;

    let total = 0;
    invoiceState.items.forEach(item => {
        const amt = parseFloat(item.amount);
        if (!isNaN(amt)) {
            total += amt;
        }
    });

    const balance = total - invoiceState.advance;

    // Update Brief Summary
    const elSub = document.getElementById("brief-subtotal");
    if (elSub) elSub.innerText = "₹" + formatIndianCurrency(total);

    const elAdv = document.getElementById("brief-advance");
    if (elAdv) elAdv.innerText = "₹" + formatIndianCurrency(invoiceState.advance);

    const elBal = document.getElementById("brief-balance");
    if (elBal) elBal.innerText = "₹" + formatIndianCurrency(balance);

    const badgeTotal = document.getElementById("mobile-badge-total");
    if (badgeTotal) badgeTotal.innerText = "₹" + formatIndianCurrency(total);

    // Update Printable Sheet
    const pTot = document.getElementById("p-total-amount");
    if (pTot) pTot.innerText = formatIndianCurrency(total);

    const pAdv = document.getElementById("p-advance-amount");
    if (pAdv) pAdv.innerText = formatIndianCurrency(invoiceState.advance);

    const pBal = document.getElementById("p-balance-amount");
    if (pBal) pBal.innerText = formatIndianCurrency(balance);

    // Amount in Words
    const wordsEl = document.getElementById("p-amount-words");
    if (wordsEl) {
        if (invoiceState.wordsOverride) {
            wordsEl.innerText = invoiceState.wordsOverride;
        } else {
            wordsEl.innerText = numberToIndianWords(balance);
        }
    }

    renderItemsPreview();
}

function overrideWords() {
    const input = document.getElementById("amount-words-override");
    invoiceState.wordsOverride = input ? input.value : "";
    calculateInvoiceValues();
}

function renderItemsPreview() {
    const tbody = document.getElementById("p-items-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    // Always draw at least 7 rows to match visual structure
    const minRows = 7;
    const count = invoiceState.items.length;
    const totalRows = Math.max(minRows, count);

    for (let i = 0; i < totalRows; i++) {
        const item = invoiceState.items[i];
        const tr = document.createElement("tr");

        if (item && (item.desc || item.qty || item.rate || item.amount)) {
            const qtyStr = item.qty ? `${item.qty} ${item.unit || ''}`.trim() : "";
            const rateStr = item.rate ? formatIndianCurrency(item.rate) : "";
            const amtStr = item.amount ? formatIndianCurrency(item.amount) : "";

            tr.innerHTML = `
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${i + 1}</td>
                <td class="border-right border-bottom font-bold text-center" style="font-size: 11px; text-transform: uppercase;">${item.desc}</td>
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${qtyStr}</td>
                <td class="border-right border-bottom text-center font-bold" style="font-size: 11px;">${rateStr}</td>
                <td class="border-bottom text-right font-bold" style="font-size: 11px; padding-right: 8px;">${amtStr}</td>
            `;
        } else {
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

function updateInvoicePreview() {
    // 1. Sender
    const sName = document.getElementById("seller-name")?.value || "";
    const sAddr = document.getElementById("seller-address")?.value || "";
    const sState = document.getElementById("seller-state")?.value || "";
    const sStateCode = document.getElementById("seller-state-code")?.value || "";
    const sPan = document.getElementById("seller-pan")?.value || "";
    const sLabel = document.getElementById("invoice-copy-label")?.value || "";

    const elSName = document.getElementById("p-seller-name");
    if (elSName) elSName.innerText = sName;
    const elSAddr = document.getElementById("p-seller-address");
    if (elSAddr) elSAddr.innerText = sAddr;
    const elSState = document.getElementById("p-seller-state");
    if (elSState) elSState.innerText = sState;
    const elSCode = document.getElementById("p-seller-state-code");
    if (elSCode) elSCode.innerText = sStateCode;
    const elSPan = document.getElementById("p-seller-pan");
    if (elSPan) elSPan.innerText = sPan;
    const elSLabel = document.getElementById("p-copy-label");
    if (elSLabel) elSLabel.innerText = sLabel;

    // 2. Client
    const cName = document.getElementById("client-name")?.value || "";
    const cAddr = document.getElementById("client-address")?.value || "";
    const cGstin = document.getElementById("client-gstin")?.value || "";
    const cDate = document.getElementById("invoice-date")?.value || "";

    const elCName = document.getElementById("p-client-name");
    if (elCName) elCName.innerText = cName || "CLIENT NAME";
    const elCAddr = document.getElementById("p-client-address");
    if (elCAddr) elCAddr.innerText = cAddr || "CLIENT ADDRESS DETAIL";
    const elCGstin = document.getElementById("p-client-gstin");
    if (elCGstin) elCGstin.innerText = cGstin;
    const elCDate = document.getElementById("p-invoice-date");
    if (elCDate) elCDate.innerText = cDate;

    calculateInvoiceValues();
}

// ============================================================
// SAMPLE DATA PRESETS & RESET
// ============================================================
function loadSampleInvoice() {
    const elClientName = document.getElementById("client-name");
    if (elClientName) elClientName.value = "KATARIYA MOVERS";

    const elClientAddr = document.getElementById("client-address");
    if (elClientAddr) elClientAddr.value = "PLOT No. 39, GHORPADE NAGAR, BEHIND BPCL PETROL PUMP, HOSPET-BALLARI MAIN ROAD, TORANAGALLU-583 123";

    const elClientGstin = document.getElementById("client-gstin");
    if (elClientGstin) elClientGstin.value = "";

    const elDate = document.getElementById("invoice-date");
    if (elDate) elDate.value = "11.7.26";

    const elAdv = document.getElementById("advance-amount");
    if (elAdv) elAdv.value = 90000;

    const elWords = document.getElementById("amount-words-override");
    if (elWords) elWords.value = "";
    invoiceState.wordsOverride = "";

    invoiceState.items = [
        { desc: "SQURE TUBE", qty: "5272", unit: "kg", rate: "26", amount: "137072" },
        { desc: "ANGAL BOX", qty: "1980", unit: "kg", rate: "22", amount: "43500" },
        { desc: "SHEETING", qty: "678", unit: "sq.m", rate: "90", amount: "61020" },
        { desc: "FLASING", qty: "150", unit: "sq.m", rate: "80", amount: "12000" },
        { desc: "AUTO CHARGE", qty: "", unit: "", rate: "", amount: "1500" },
        { desc: "BOLT & NUT'S", qty: "", unit: "", rate: "", amount: "3500" }
    ];

    renderItemsEditor();
    updateInvoicePreview();
}

function resetInvoiceForm() {
    const elClientName = document.getElementById("client-name");
    if (elClientName) elClientName.value = "";

    const elClientAddr = document.getElementById("client-address");
    if (elClientAddr) elClientAddr.value = "";

    const elClientGstin = document.getElementById("client-gstin");
    if (elClientGstin) elClientGstin.value = "";

    const today = new Date();
    const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear().toString().slice(-2)}`;
    const elDate = document.getElementById("invoice-date");
    if (elDate) elDate.value = formattedDate;

    const elAdv = document.getElementById("advance-amount");
    if (elAdv) elAdv.value = 0;

    const elWords = document.getElementById("amount-words-override");
    if (elWords) elWords.value = "";
    invoiceState.wordsOverride = "";

    invoiceState.items = [
        { desc: "", qty: "", unit: "", rate: "", amount: "" }
    ];

    renderItemsEditor();
    updateInvoicePreview();
}

// ============================================================
// PDF, IMAGE & PRINT EXPORTS
// ============================================================
function triggerPrint() {
    window.print();
}

function downloadInvoicePDF() {
    const invoiceEl = document.getElementById("printable-invoice");
    if (!invoiceEl) {
        alert("Invoice element not found.");
        return;
    }

    const clientName = (document.getElementById("client-name")?.value || "Invoice").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = (document.getElementById("invoice-date")?.value || "date").replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `JSS_Bill_${clientName}_${dateStr}.pdf`;

    // Check if html2pdf is available
    if (typeof html2pdf !== "undefined") {
        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Show downloading state
        const originalText = event?.target?.innerHTML || "";
        if (event && event.target) event.target.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

        html2pdf().set(opt).from(invoiceEl).save().then(() => {
            if (event && event.target) event.target.innerHTML = originalText;
        }).catch(err => {
            console.error("PDF generation failed:", err);
            if (event && event.target) event.target.innerHTML = originalText;
            window.print();
        });
    } else {
        // Fallback to native print
        window.print();
    }
}

function downloadInvoiceImage() {
    const invoiceEl = document.getElementById("printable-invoice");
    if (!invoiceEl) return;

    const clientName = (document.getElementById("client-name")?.value || "Invoice").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `JSS_Bill_${clientName}.png`;

    if (typeof html2canvas !== "undefined") {
        html2canvas(invoiceEl, { scale: 2, useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("Image generation failed:", err);
            alert("Could not export image. Please use PDF or Print.");
        });
    } else {
        alert("Image generator library is not loaded. Please use Print / PDF.");
    }
}
