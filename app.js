const KEY = "pmspx_carga_horaria_v1";

const state =
    JSON.parse(localStorage.getItem(KEY) || "null") || {

        activeUser: "u1",

        users: [
            {
                id: "u1",

                name: "Usuário 1",

                days: {},

                records: []
            }
        ]
    };


let editingRecordId = null;

let installPrompt = null;


const $ = id =>
    document.getElementById(id);


const save = () =>
    localStorage.setItem(
        KEY,
        JSON.stringify(state)
    );


const active = () =>
    state.users.find(
        u => u.id === state.activeUser
    ) || state.users[0];


const pad = n =>
    String(n).padStart(2, "0");


const ym = () =>
    $("monthPicker").value;


const monthDays = month => {

    const [year, monthNumber] =
        month.split("-").map(Number);

    return new Date(
        year,
        monthNumber,
        0
    ).getDate();
};


const dateKey = (month, day) =>
    `${month}-${pad(day)}`;


const formatDate = date =>
    new Date(
        date + "T12:00:00"
    ).toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );


const hoursText = hours => {

    return Number.isInteger(hours)

        ? `${hours}h`

        : `${hours
            .toFixed(1)
            .replace(".", ",")}h`;
};


/* INICIALIZAÇÃO */

function init() {

    const now = new Date();

    $("monthPicker").value =
        `${now.getFullYear()}-${pad(
            now.getMonth() + 1
        )}`;


    renderUsers();

    render();


    $("prevMonth").onclick =
        () => changeMonth(-1);


    $("nextMonth").onclick =
        () => changeMonth(1);


    $("todayMonth").onclick =
        () => {

            $("monthPicker").value =
                `${now.getFullYear()}-${pad(
                    now.getMonth() + 1
                )}`;

            render();
        };


    $("monthPicker").onchange =
        render;


    $("userSelect").onchange =
        event => {

            state.activeUser =
                event.target.value;

            save();

            render();
        };


    $("addUserBtn").onclick =
        addUser;


    $("editUserBtn").onclick =
        editUser;


    $("addRecordBtn").onclick =
        () => openModal();


    $("closeModal").onclick =
        closeModal;


    $("modal").onclick =
        event => {

            if (
                event.target ===
                $("modal")
            ) {
                closeModal();
            }
        };


    $("recordType").onchange =
        () => {

            const isFolga =
                $("recordType").value ===
                "folga";


            $("recordHours").disabled =
                isFolga;


            if (isFolga) {

                $("recordHours").value = 0;
            }
        };


    $("saveRecord").onclick =
        saveRecord;


    $("resetBtn").onclick =
        resetAll;


    /* INSTALAÇÃO PWA */

    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();

            installPrompt = event;

            $("installBtn")
                .classList
                .remove("hidden");
        }
    );


    $("installBtn").onclick =
        async () => {

            if (!installPrompt) return;

            installPrompt.prompt();

            await installPrompt.userChoice;

            installPrompt = null;

            $("installBtn")
                .classList
                .add("hidden");
        };


    /* SERVICE WORKER */

    if (
        "serviceWorker" in navigator
    ) {

        navigator.serviceWorker
            .register("sw.js")
            .catch(() => {});
    }
}


/* USUÁRIOS */

function renderUsers() {

    const select =
        $("userSelect");

    select.innerHTML = "";


    state.users.forEach(
        user => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                user.id;

            option.textContent =
                user.name;

            select.appendChild(
                option
            );
        }
    );


    select.value =
        state.activeUser;
}


function addUser() {

    const name =
        prompt(
            "Nome do novo usuário:",
            "Novo usuário"
        );


    if (!name?.trim()) return;


    const id =
        "u" + Date.now();


    state.users.push({

        id,

        name: name.trim(),

        days: {},

        records: []
    });


    state.activeUser = id;


    save();

    renderUsers();

    render();
}


function editUser() {

    const user = active();


    const name =
        prompt(
            "Editar nome do usuário:",
            user.name
        );


    if (!name?.trim()) return;


    user.name =
        name.trim();


    save();

    renderUsers();
}


/* MÊS */

function changeMonth(delta) {

    const date =
        new Date(
            ym() + "-01T12:00:00"
        );


    date.setMonth(
        date.getMonth() + delta
    );


    $("monthPicker").value =
        `${date.getFullYear()}-${pad(
            date.getMonth() + 1
        )}`;


    render();
}


/* RENDER */

function render() {

    const user = active();

    const month = ym();


    if (!user || !month)
        return;


    renderCalendar(
        user,
        month
    );


    renderRecords(
        user,
        month
    );


    renderSummary(
        user,
        month
    );


    renderHistory(user);
}


/* CALENDÁRIO */

function renderCalendar(
    user,
    month
) {

    const calendar =
        $("calendar");


    calendar.innerHTML = "";


    [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb"
    ].forEach(day => {

        const element =
            document.createElement(
                "div"
            );

        element.className =
            "weekday";

        element.textContent =
            day;

        calendar.appendChild(
            element
        );
    });


    const [
        year,
        monthNumber
    ] =
        month
            .split("-")
            .map(Number);


    const firstDay =
        new Date(
            year,
            monthNumber - 1,
            1
        ).getDay();


    const total =
        monthDays(month);


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const element =
            document.createElement(
                "div"
            );

        element.className =
            "day empty";

        calendar.appendChild(
            element
        );
    }


    for (
        let day = 1;
        day <= total;
        day++
    ) {

        const key =
            dateKey(
                month,
                day
            );


        const element =
            document.createElement(
                "button"
            );


        element.className =
            "day" +
            (
                user.days[key]
                    ? " selected"
                    : ""
            );


        const today =
            new Date();


        if (
            today.getFullYear() === year &&
            today.getMonth() ===
                monthNumber - 1 &&
            today.getDate() === day
        ) {

            element.classList.add(
                "today"
            );
        }


        const extras =
            user.records
                .filter(
                    record =>
                        record.date === key &&
                        record.type === "extra"
                )
                .reduce(
                    (total, record) =>
                        total +
                        Number(
                            record.hours || 0
                        ),
                    0
                );


        element.innerHTML = `

            <div class="num">
                ${day}
            </div>

            ${
                user.days[key]
                    ? `
                        <div class="tag">
                            TRABALHO · 10h
                        </div>
                      `
                    : ""
            }

            ${
                extras
                    ? `
                        <div class="extra">
                            +${hoursText(extras)}
                        </div>
                      `
                    : ""
            }

        `;


        element.onclick = () => {

            user.days[key] =
                !user.days[key];


            save();

            render();
        };


        calendar.appendChild(
            element
        );
    }
}


/* REGISTROS */

function renderRecords(
    user,
    month
) {

    const container =
        $("records");


    container.innerHTML = "";


    const records =
        user.records
            .filter(
                record =>
                    record.date.startsWith(
                        month
                    )
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    if (!records.length) {

        container.innerHTML =
            `
            <div>
                Nenhum registro extra
                neste mês.
            </div>
            `;

        return;
    }


    records.forEach(
        record => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "record";


            element.innerHTML = `

                <div class="record-main">

                    <strong>
                        ${formatDate(
                            record.date
                        )}
                    </strong>

                    <small>
                        ${
                            record.note ||
                            "Sem observação"
                        }
                    </small>

                </div>


                <span class="badge ${
                    record.type === "folga"
                        ? "folga"
                        : ""
                }">

                    ${
                        record.type === "folga"

                            ? "FOLGA CAÇADA"

                            : "+" +
                              hoursText(
                                  Number(
                                      record.hours ||
                                      0
                                  )
                              )
                    }

                </span>


                <div class="record-actions">

                    <button>
                        ✎
                    </button>

                    <button>
                        ×
                    </button>

                </div>
            `;


            const buttons =
                element.querySelectorAll(
                    "button"
                );


            buttons[0].onclick =
                () =>
                    openModal(record);


            buttons[1].onclick =
                () => {

                    if (
                        confirm(
                            "Excluir este registro?"
                        )
                    ) {

                        user.records =
                            user.records.filter(
                                item =>
                                    item.id !==
                                    record.id
                            );

                        save();

                        render();
                    }
                };


            container.appendChild(
                element
            );
        }
    );
}


/* RESUMO */

function renderSummary(
    user,
    month
) {

    const days =
        Object.keys(
            user.days
        )
        .filter(
            key =>
                key.startsWith(month) &&
                user.days[key]
        )
        .length;


    const normal =
        days * 10;


    const extra =
        user.records
            .filter(
                record =>
                    record.date.startsWith(
                        month
                    ) &&
                    record.type === "extra"
            )
            .reduce(
                (total, record) =>
                    total +
                    Number(
                        record.hours || 0
                    ),
                0
            );


    $("daysCount")
        .textContent = days;


    $("normalHours")
        .textContent =
        hoursText(normal);


    $("extraHours")
        .textContent =
        hoursText(extra);


    $("totalHours")
        .textContent =
        hoursText(
            normal + extra
        );
}


/* HISTÓRICO */

function renderHistory(user) {

    const container =
        $("history");


    container.innerHTML = "";


    const months =
        new Set();


    Object.keys(
        user.days
    )
    .filter(
        key => user.days[key]
    )
    .forEach(
        key =>
            months.add(
                key.slice(0, 7)
            )
    );


    user.records.forEach(
        record =>
            months.add(
                record.date.slice(0, 7)
            )
    );


    [
        ...months
    ]
    .sort()
    .reverse()
    .slice(0, 12)
    .forEach(
        month => {

            const days =
                Object.keys(
                    user.days
                )
                .filter(
                    key =>
                        key.startsWith(
                            month
                        ) &&
                        user.days[key]
                )
                .length;


            const extra =
                user.records
                    .filter(
                        record =>
                            record.date.startsWith(
                                month
                            ) &&
                            record.type ===
                                "extra"
                    )
                    .reduce(
                        (total, record) =>
                            total +
                            Number(
                                record.hours ||
                                0
                            ),
                        0
                    );


            const [
                year,
                monthNumber
            ] =
                month
                    .split("-")
                    .map(Number);


            const label =
                new Date(
                    year,
                    monthNumber - 1,
                    1
                )
                .toLocaleDateString(
                    "pt-BR",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "history-row";


            element.innerHTML = `

                <span>
                    ${
                        label.charAt(0)
                        .toUpperCase() +
                        label.slice(1)
                    }
                </span>

                <strong>
                    ${days} dias ·
                    ${hoursText(
                        days * 10 + extra
                    )}
                </strong>
            `;


            container.appendChild(
                element
            );
        }
    );


    if (!container.children.length) {

        container.innerHTML =
            `
            <div>
                O histórico aparecerá
                conforme os meses forem
                preenchidos.
            </div>
            `;
    }
}


/* MODAL */

function openModal(
    record = null
) {

    editingRecordId =
        record?.id || null;


    $("modalTitle")
        .textContent =
        record
            ? "Editar registro"
            : "Novo registro";


    const month =
        ym();


    $("recordType").value =
        record?.type || "extra";


    $("recordDate").value =
        record?.date ||
        `${month}-01`;


    $("recordHours").value =
        record?.hours || 1;


    $("recordNote").value =
        record?.note || "";


    $("recordHours").disabled =
        $("recordType").value ===
        "folga";


    $("modal")
        .classList
        .remove("hidden");
}


function closeModal() {

    $("modal")
        .classList
        .add("hidden");

    editingRecordId = null;
}


/* SALVAR REGISTRO */

function saveRecord() {

    const user = active();


    const type =
        $("recordType").value;


    const date =
        $("recordDate").value;


    const hours =
        type === "folga"
            ? 0
            : Number(
                $("recordHours").value
            );


    if (!date) {

        alert(
            "Informe a data."
        );

        return;
    }


    if (
        type === "extra" &&
        hours <= 0
    ) {

        alert(
            "Informe uma quantidade de horas extras maior que zero."
        );

        return;
    }


    const record = {

        id:
            editingRecordId ||
            "r" + Date.now(),

        type,

        date,

        hours,

        note:
            $("recordNote")
                .value
                .trim()
    };


    if (editingRecordId) {

        const index =
            user.records.findIndex(
                item =>
                    item.id ===
                    editingRecordId
            );


        user.records[index] =
            record;

    } else {

        user.records.push(
            record
        );
    }


    save();

    closeModal();

    render();
}


/* RESET */

function resetAll() {

    if (
        confirm(
            "Isso apagará todos os usuários, escalas e registros. Continuar?"
        )
    ) {

        localStorage.removeItem(
            KEY
        );

        location.reload();
    }
}


init();
