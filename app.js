/* ============================================================
   Real Roadside Assistance — booking logic
   Static site: Formspree for delivery, Cash App for deposit.
   ============================================================ */
(function () {
  "use strict";

  var FORMSPREE = "https://formspree.io/f/xnjkpvel";
  var CASHTAG = "sauxyDay";
  var DEPOSIT = 40;
  var TRUNK_ADDON = 20;
  var DAYS_AHEAD = 14;

  // 3-hour windows used for every day
  var BLOCKS = [
    { start: 8, label: "8:00 – 11:00 AM" },
    { start: 11, label: "11:00 AM – 2:00 PM" },
    { start: 14, label: "2:00 – 5:00 PM" },
    { start: 17, label: "5:00 – 8:00 PM" }
  ];

  var SERVICES = {
    detailing: [
      { id: "pkg1", name: "Package 1 — Standard Clean", tag: "Detail",
        desc: "Inside/outside seats, floor mats & carpet cleaning. Rims included.",
        sedan: 50, suv: 75 },
      { id: "pkg2", name: "Package 2 — Shampoo Clean", tag: "Detail",
        desc: "Everything in Package 1 plus carpet shampoo. Rims included.",
        sedan: 80, suv: 100 },
      { id: "pkg3", name: "Package 3 — Clean + Oil Change", tag: "Detail",
        desc: "Everything in Package 1 plus an oil change. Rims included.",
        sedan: 135, suv: 155 }
    ],
    roadside: [
      { id: "jump", name: "Jumpstart", tag: "Roadside", price: 40,
        desc: "Battery jumpstart to get you moving again." },
      { id: "tire", name: "Tire Rotation / Spare", tag: "Roadside", price: 55,
        desc: "Rotation or spare swap. New tires $80 each / $145 a pair." },
      { id: "lockout", name: "Lockout", tag: "Roadside", price: 125,
        desc: "Locked out of your vehicle? We get you back in." },
      { id: "diag", name: "Diagnostic Check", tag: "Roadside", price: 40,
        desc: "Applied to service if done by us. Non-refundable." },
      { id: "gas", name: "3 Gallons of Gas", tag: "Roadside", price: 25,
        desc: "Ran dry? We bring 3 gallons to you." },
      { id: "brakes", name: "Brake Pads & Rotors", tag: "Service", quote: true,
        sedanRange: "$75–$300", suvRange: "$100–$400",
        priceLabel: "$75–$300 Sedan · $100–$400 SUV",
        desc: "Pads & rotors. Final price depends on how many axles — confirmed before any work." }
    ]
  };

  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function money(n) { return "$" + n; }

  // ---- booking state ----
  var state = {
    category: "detailing",
    serviceId: null,
    vehicle: "sedan",
    trunk: false,
    timing: null,        // "asap" or "scheduled"
    dayIndex: null,
    block: null,
    step: 1
  };

  function currentService() {
    return SERVICES[state.category].filter(function (s) { return s.id === state.serviceId; })[0] || null;
  }

  function servicePrice() {
    var s = currentService();
    if (!s || s.quote) return 0;
    var base = state.category === "detailing" ? s[state.vehicle] : s.price;
    if (state.category === "detailing" && state.trunk) base += TRUNK_ADDON;
    return base;
  }

  /* =========================================================
     RENDER: service showcase cards (top of page menu)
     ========================================================= */
  function showcaseCards() {
    var det = $("#detailingCards");
    var rds = $("#roadsideCards");
    det.innerHTML = SERVICES.detailing.map(function (s) {
      return '<article class="card">' +
        '<p class="card-tag">' + s.tag + '</p>' +
        '<h4 class="card-name">' + s.name.replace(/—/, "<br>") + '</h4>' +
        '<p class="card-desc">' + s.desc + '</p>' +
        '<div class="card-price">' +
          '<b>' + money(s.sedan) + '</b><span class="pill">Sedan</span>' +
          '<span class="sep">/</span>' +
          '<b>' + money(s.suv) + '</b><span class="pill">SUV</span>' +
        '</div></article>';
    }).join("");
    rds.innerHTML = SERVICES.roadside.map(function (s) {
      var price = s.quote
        ? '<div class="card-price"><b>' + s.sedanRange + '</b><span class="pill">Sedan</span>' +
          '<span class="sep">/</span><b>' + s.suvRange + '</b><span class="pill">SUV</span></div>'
        : '<div class="card-price"><b>' + money(s.price) + '</b><span class="pill">flat</span></div>';
      return '<article class="card">' +
        '<p class="card-tag">' + s.tag + '</p>' +
        '<h4 class="card-name">' + s.name + '</h4>' +
        '<p class="card-desc">' + s.desc + '</p>' +
        price +
        '</article>';
    }).join("");
  }

  /* =========================================================
     RENDER: service pick list (step 1)
     ========================================================= */
  function renderPickList() {
    var list = $("#servicePick");
    var items = SERVICES[state.category];
    list.innerHTML = items.map(function (s) {
      var priceHtml;
      if (state.category === "detailing") {
        priceHtml = '<span class="pick-price">' + money(s.sedan) +
          '<small>Sedan · ' + money(s.suv) + ' SUV</small></span>';
      } else if (s.quote) {
        priceHtml = '<span class="pick-price">Quote<small>' + s.priceLabel + '</small></span>';
      } else {
        priceHtml = '<span class="pick-price">' + money(s.price) + '<small>flat</small></span>';
      }
      return '<button type="button" class="pick" data-id="' + s.id + '">' +
        '<span class="pick-radio"></span>' +
        '<span class="pick-info"><b>' + s.name + '</b><small>' + s.desc + '</small></span>' +
        priceHtml + '</button>';
    }).join("");

    $all(".pick", list).forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.serviceId = btn.getAttribute("data-id");
        $all(".pick", list).forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
      });
    });

    // vehicle row only for detailing
    $("#vehicleRow").hidden = state.category !== "detailing";
  }

  /* =========================================================
     RENDER: days + slots (step 2)
     ========================================================= */
  function buildDays() {
    var now = new Date();
    var days = [];
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function renderDayScroller() {
    var days = buildDays();
    var now = new Date();
    var wrap = $("#dayScroller");
    wrap.innerHTML = days.map(function (d, i) {
      var label = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : DOW[d.getDay()]);
      return '<button type="button" class="day-chip" data-day="' + i + '">' +
        '<span class="dow">' + label + '</span>' +
        '<span class="dnum">' + d.getDate() + '</span>' +
        '<span class="mon">' + MONTHS[d.getMonth()] + '</span></button>';
    }).join("");

    $all(".day-chip", wrap).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $all(".day-chip", wrap).forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        state.dayIndex = parseInt(chip.getAttribute("data-day"), 10);
        state.block = null;
        clearAsap();
        renderSlots();
      });
    });
  }

  function renderSlots() {
    var grid = $("#slotGrid");
    if (state.dayIndex === null) {
      grid.innerHTML = '<p class="slot-empty">Pick a day above to see open windows.</p>';
      return;
    }
    var days = buildDays();
    var d = days[state.dayIndex];
    var now = new Date();
    var isToday = state.dayIndex === 0;

    var available = BLOCKS.filter(function (b) {
      // for today, only windows that haven't started yet (with a small buffer)
      if (!isToday) return true;
      return b.start > now.getHours();
    });

    if (!available.length) {
      grid.innerHTML = '<p class="slot-empty">No more windows today — try another day, or choose ASAP above.</p>';
      return;
    }

    grid.innerHTML = available.map(function (b) {
      return '<button type="button" class="slot" data-start="' + b.start + '">' + b.label + '</button>';
    }).join("");

    $all(".slot", grid).forEach(function (slot) {
      slot.addEventListener("click", function () {
        $all(".slot", grid).forEach(function (s) { s.classList.remove("selected"); });
        slot.classList.add("selected");
        clearAsap();
        state.timing = "scheduled";
        var start = parseInt(slot.getAttribute("data-start"), 10);
        state.block = BLOCKS.filter(function (x) { return x.start === start; })[0];
      });
    });
  }

  function clearAsap() {
    $("#asapBox").classList.remove("selected");
    $("#asapBox").querySelector("input").checked = false;
  }
  function clearSlots() {
    $all(".slot").forEach(function (s) { s.classList.remove("selected"); });
    state.block = null;
  }

  /* =========================================================
     Friendly date / timing strings
     ========================================================= */
  function timingText() {
    if (state.timing === "asap") return "ASAP — soonest available";
    if (state.timing === "scheduled" && state.dayIndex !== null && state.block) {
      var d = buildDays()[state.dayIndex];
      return DOW[d.getDay()] + " " + MONTHS[d.getMonth()] + " " + d.getDate() + " · " + state.block.label;
    }
    return null;
  }

  /* =========================================================
     STEP NAVIGATION
     ========================================================= */
  function goToStep(n) {
    state.step = n;
    $all(".step").forEach(function (f) {
      f.classList.toggle("is-active", parseInt(f.getAttribute("data-step"), 10) === n);
    });
    $all("#stepNav li").forEach(function (li) {
      var s = parseInt(li.getAttribute("data-step"), 10);
      li.classList.toggle("active", s === n);
      li.classList.toggle("done", s < n);
    });
    if (n === 4) renderReview();
    // keep the form in view on step change
    var shell = $(".booking-shell");
    if (shell) shell.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateStep(n) {
    $("#formError").hidden = true;
    if (n === 1) {
      if (!state.serviceId) { flash("Pick a service to continue."); return false; }
      return true;
    }
    if (n === 2) {
      if (!state.timing || (state.timing === "scheduled" && (!state.block || state.dayIndex === null))) {
        flash("Choose ASAP or a 3-hour window."); return false;
      }
      return true;
    }
    if (n === 3) {
      var ok = true;
      $all("#bookingForm .step[data-step='3'] [required]").forEach(function (input) {
        var fld = input.closest(".fld");
        var valid = input.checkValidity() && input.value.trim() !== "";
        if (fld) fld.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) flash("Fill in the highlighted fields.");
      return ok;
    }
    return true;
  }

  function flash(msg) {
    var el = $("#formError");
    el.textContent = msg;
    el.hidden = false;
  }

  /* =========================================================
     REVIEW (step 4)
     ========================================================= */
  function row(k, v, cls) {
    return '<div class="review-row ' + (cls || "") + '"><span class="rk">' + k +
      '</span><span class="rv">' + v + '</span></div>';
  }

  function renderReview() {
    var s = currentService();
    var price = servicePrice();
    var f = $("#bookingForm");
    var html = "";
    html += row("Service", s ? s.name : "—");
    if (state.category === "detailing") {
      html += row("Vehicle", state.vehicle === "sedan" ? "Sedan" : "SUV / Truck" + (state.trunk ? " + trunk" : ""));
      if (state.trunk) html += row("Add-on", "Trunk cleaning (+" + money(TRUNK_ADDON) + ")");
    }
    html += row("Timing", timingText() || "—");
    html += row("Name", val(f, "name"));
    html += row("Phone", val(f, "phone"));
    html += row("Address", val(f, "address"));
    html += row("Vehicle", val(f, "vehicle_details") + (val(f, "vehicle_color") ? " · " + val(f, "vehicle_color") : ""));
    if (s && s.quote) {
      html += row("Service total", "Quoted on site", "total");
      html += row("Est. range", s.priceLabel);
    } else {
      html += row("Service total", money(price), "total");
    }
    html += row("Deposit due now", money(DEPOSIT) + " (applied to total)", "deposit");
    $("#review").innerHTML = html;
  }

  function val(form, name) {
    var el = form.elements[name];
    return el ? el.value.trim() : "";
  }

  /* =========================================================
     SUBMIT -> Formspree -> Cash App deposit
     ========================================================= */
  function buildPayload() {
    var f = $("#bookingForm");
    var s = currentService();
    var fd = new FormData();
    fd.append("Service", s ? s.name : "");
    fd.append("Category", state.category);
    if (state.category === "detailing") {
      fd.append("Vehicle type", state.vehicle === "sedan" ? "Sedan" : "SUV / Truck");
      fd.append("Trunk add-on", state.trunk ? "Yes (+$20)" : "No");
    }
    fd.append("Timing", timingText() || "");
    fd.append("Service total", (s && s.quote) ? ("Quote — " + s.priceLabel) : money(servicePrice()));
    fd.append("Deposit", money(DEPOSIT));
    fd.append("Name", val(f, "name"));
    fd.append("Phone", val(f, "phone"));
    fd.append("Email", val(f, "email"));
    fd.append("Service address", val(f, "address"));
    fd.append("Vehicle details", val(f, "vehicle_details"));
    fd.append("Vehicle color", val(f, "vehicle_color"));
    fd.append("Notes", val(f, "notes"));
    // Formspree niceties
    fd.append("_subject", "New booking — " + (s ? s.name : "") + " (" + (timingText() || "") + ")");
    fd.append("_replyto", val(f, "email"));
    return fd;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateStep(3)) { goToStep(3); return; }
    var btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";

    fetch(FORMSPREE, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: buildPayload()
    }).then(function (res) {
      if (res.ok) { showSuccess(); }
      else {
        return res.json().then(function (data) {
          var msg = (data && data.errors && data.errors.length)
            ? data.errors.map(function (x) { return x.message; }).join(", ")
            : "Something went wrong sending your booking.";
          throw new Error(msg);
        });
      }
    }).catch(function (err) {
      flash(err.message + " You can also call/text 313·488·7588.");
      btn.disabled = false;
      btn.textContent = "Submit Booking";
    });
  }

  function showSuccess() {
    $("#bookingForm").hidden = true;
    $("#stepNav").hidden = true;
    var ok = $("#success");
    ok.hidden = false;
    ok.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetAll() {
    $("#success").hidden = true;
    $("#stepNav").hidden = false;
    var form = $("#bookingForm");
    form.hidden = false;
    form.reset();
    state = { category: "detailing", serviceId: null, vehicle: "sedan", trunk: false,
      timing: null, dayIndex: null, block: null, step: 1 };
    // reset visuals
    $all(".seg-btn[data-cat]").forEach(function (b, i) { b.classList.toggle("active", i === 0); });
    $all(".seg-btn[data-vehicle]").forEach(function (b, i) { b.classList.toggle("active", i === 0); });
    clearAsap();
    renderPickList();
    renderDayScroller();
    renderSlots();
    var btn = $("#submitBtn"); btn.disabled = false; btn.textContent = "Submit Booking";
    goToStep(1);
  }

  /* =========================================================
     WIRE UP
     ========================================================= */
  function init() {
    $("#year").textContent = new Date().getFullYear();
    showcaseCards();
    renderPickList();
    renderDayScroller();
    renderSlots();

    // category toggle
    $all(".seg-btn[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all(".seg-btn[data-cat]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.category = btn.getAttribute("data-cat");
        state.serviceId = null;
        renderPickList();
      });
    });

    // vehicle toggle
    $all(".seg-btn[data-vehicle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all(".seg-btn[data-vehicle]").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.vehicle = btn.getAttribute("data-vehicle");
      });
    });

    // trunk
    $("#trunkAddon").addEventListener("change", function () { state.trunk = this.checked; });

    // ASAP
    var asap = $("#asapBox");
    asap.addEventListener("click", function () {
      asap.classList.add("selected");
      asap.querySelector("input").checked = true;
      state.timing = "asap";
      clearSlots();
      $all(".day-chip").forEach(function (c) { c.classList.remove("active"); });
      state.dayIndex = null;
      renderSlots();
    });

    // next / prev
    $all("[data-next]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (validateStep(state.step)) goToStep(state.step + 1);
      });
    });
    $all("[data-prev]").forEach(function (b) {
      b.addEventListener("click", function () { goToStep(state.step - 1); });
    });

    $("#bookingForm").addEventListener("submit", onSubmit);
    $("#resetBtn").addEventListener("click", resetAll);

    // clear field error on input
    $all("#bookingForm input, #bookingForm textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var fld = el.closest(".fld");
        if (fld) fld.classList.remove("invalid");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
