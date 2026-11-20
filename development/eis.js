/*global m comp state db _ moment numeral Chart rupiah hari*/

// Variabel chart global
var chartInstanceVisit = null;
var chartInstanceGuarantor = null;

_.assign(comp, {
    eis: () => {
        // Cek Role (Hanya Admin & Manajemen)
        if (![4, 1].includes(+_.get(state, 'login.peranan'))) {
            return m('.notification.is-danger.m-6', [
                m('h1.title', 'Akses Ditolak'),
                m('button.button', {onclick: () => state.route = 'dashboard'}, 'Kembali')
            ]);
        }

        return m('.content', {
            oncreate: () => {
                console.log("Halaman EIS dimuat, mencoba tarik data...");
                loadRealData();
            }
        }, [
            // HEADER
            m('.level.mb-5', [
                m('.level-left', m('div', [
                    m('h2.title.is-4', 'Executive Information System'),
                    m('p.subtitle.is-6', 'Monitoring Data Real-time')
                ])),
                m('.level-right', m('button.button.is-info.is-light', {
                    onclick: () => loadRealData()
                }, m('span', 'Refresh Data')))
            ]),

            // KPI CARDS
            m('.columns.is-multiline', [
                // Card 1
                m('.column.is-3', m('.box', {style: 'border-left: 5px solid #3298dc;'}, [
                    m('p.heading', 'Kunjungan Hari Ini'),
                    m('h1.title.is-3.has-text-info', state.eis?.todayCount || 0),
                    m('p.is-size-7', 'Pasien')
                ])),
                // Card 2
                m('.column.is-3', m('.box', {style: 'border-left: 5px solid #48c774;'}, [
                    m('p.heading', 'Estimasi Omset'),
                    m('h1.title.is-4.has-text-success', rupiah(state.eis?.estIncome || 0)),
                    m('p.is-size-7', 'IDR (Est)')
                ])),
                // Card 3
                m('.column.is-3', m('.box', {style: 'border-left: 5px solid #ffdd57;'}, [
                    m('p.heading', 'BPJS vs Umum'),
                    m('div', [
                        m('strong.has-text-success', 'BPJS: ' + (state.eis?.countBPJS || 0)),
                        m('span.mx-2', '|'),
                        m('strong.has-text-info', 'Umum: ' + (state.eis?.countUmum || 0))
                    ])
                ])),
                // Card 4
                m('.column.is-3', m('.box', {style: 'border-left: 5px solid #f14668;'}, [
                    m('p.heading', 'Antrean Obat/Dokter'),
                    m('h1.title.is-3.has-text-danger', state.eis?.activeQueue || 0),
                    m('p.is-size-7', 'Belum Selesai')
                ]))
            ]),

            // GRAFIK
            m('.columns', [
                m('.column.is-8', m('.box', [
                    m('h3.title.is-6', 'Tren Kunjungan 7 Hari'),
                    m('canvas#chartVisits', {height: 100})
                ])),
                m('.column.is-4', m('.box', [
                    m('h3.title.is-6', 'Komposisi Pasien'),
                    m('canvas#chartGuarantor', {height: 200})
                ]))
            ]),

            // TABEL PENYAKIT
            m('.box', [
                m('h3.title.is-6', 'Top 10 Diagnosa (ICD-10)'),
                m('.table-container', m('table.table.is-striped.is-fullwidth', [
                    m('thead', m('tr', [m('th', '#'), m('th', 'Kode'), m('th', 'Jumlah')])),
                    m('tbody', (state.eis?.topDiseases || []).length ? 
                        state.eis.topDiseases.map((d, i) => m('tr', [
                            m('td', i + 1),
                            m('td.fw-bold', d.code),
                            m('td', d.count)
                        ])) : m('tr', m('td[colspan=3]', 'Belum ada data diagnosa.'))
                    )
                ]))
            ])
        ]);
    }
});

// --- LOGIKA PEMROSESAN DATA ---
function loadRealData() {
    state.loading = true;
    m.redraw();

    db.patients.toArray(allPatients => {
        console.log("Total Pasien di DB:", allPatients.length);
        if(allPatients.length > 0) console.log("Contoh Data Pasien:", allPatients[0]);

        const todayStart = moment().startOf('day').valueOf(); // Jam 00:00 hari ini (timestamp)
        const todayEnd = moment().endOf('day').valueOf();     // Jam 23:59 hari ini (timestamp)

        // 1. Hitung Kunjungan Hari Ini
        // Kita gabung Rawat Jalan & IGD
        let patientsToday = allPatients.filter(p => {
            // Ambil semua kunjungan
            let visits = [...(p.rawatJalan || []), ...(p.emergency || [])];
            
            // Cek apakah ada kunjungan di HARI INI
            // Kita pakai moment(v.tanggal).valueOf() agar aman baca timestamp atau string
            return visits.some(v => {
                let tgl = moment(v.tanggal).valueOf();
                return tgl >= todayStart && tgl <= todayEnd;
            });
        });

        console.log("Pasien Hari Ini:", patientsToday.length);

        // 2. Hitung Cara Bayar (Hari Ini)
        let countUmum = 0;
        let countBPJS = 0;
        
        patientsToday.forEach(p => {
            let visits = [...(p.rawatJalan || []), ...(p.emergency || [])];
            let lastVisit = _.last(visits); // Ambil kunjungan terakhir
            
            if (lastVisit) {
                // Cek properti cara_bayar (biasanya 1=umum, 2=bpjs)
                if (lastVisit.cara_bayar === 1) countUmum++;
                else countBPJS++;
            }
        });

        // 3. Hitung Antrean (Yang belum diperiksa dokter)
        let activeQueue = patientsToday.filter(p => {
            let visits = [...(p.rawatJalan || []), ...(p.emergency || [])];
            let lastVisit = _.last(visits);
            // Dianggap antre jika SOAP Dokter masih kosong
            return lastVisit && !lastVisit.soapDokter;
        }).length;

        // 4. Data Grafik 7 Hari
        let labels7 = [];
        let data7 = [];
        
        for (let i = 6; i >= 0; i--) {
            let dStart = moment().subtract(i, 'days').startOf('day').valueOf();
            let dEnd = moment().subtract(i, 'days').endOf('day').valueOf();
            
            labels7.push(moment(dStart).format('dd, DD MMM'));
            
            let count = allPatients.filter(p => {
                let visits = [...(p.rawatJalan || []), ...(p.emergency || [])];
                return visits.some(v => {
                    let t = moment(v.tanggal).valueOf();
                    return t >= dStart && t <= dEnd;
                });
            }).length;
            data7.push(count);
        }

        // 5. Top 10 Diagnosa (Dari seluruh histori)
        let diagnoses = [];
        allPatients.forEach(p => {
            let visits = [...(p.rawatJalan || []), ...(p.emergency || [])];
            visits.forEach(v => {
                if (v.soapDokter && v.soapDokter.diagnosa) {
                    v.soapDokter.diagnosa.forEach(d => diagnoses.push(d.code));
                }
            });
        });
        
        let diagnosesCount = _.countBy(diagnoses);
        let top10 = _.map(diagnosesCount, (val, key) => ({code: key, count: val}))
                     .sort((a, b) => b.count - a.count)
                     .slice(0, 10);

        // SIMPAN KE STATE
        state.eis = {
            todayCount: patientsToday.length,
            estIncome: patientsToday.length * 150000, // Asumsi 150rb/pasien
            countUmum: countUmum,
            countBPJS: countBPJS,
            activeQueue: activeQueue,
            topDiseases: top10
        };

        state.loading = false;
        m.redraw(); // Update tampilan Mithril
        
        // Render Chart
        renderCharts(labels7, data7, countBPJS, countUmum);
    });
}

function renderCharts(labels, data, bpjs, umum) {
    if (typeof Chart === 'undefined') return;

    if (chartInstanceVisit) chartInstanceVisit.destroy();
    if (chartInstanceGuarantor) chartInstanceGuarantor.destroy();

    const ctx1 = document.getElementById('chartVisits');
    if (ctx1) {
        chartInstanceVisit = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Kunjungan',
                    data: data,
                    borderColor: '#3298dc',
                    tension: 0.3,
                    fill: false
                }]
            }
        });
    }

    const ctx2 = document.getElementById('chartGuarantor');
    if (ctx2) {
        // Jika data kosong, kasih dummy 1 biar chart muncul
        let finalData = (bpjs === 0 && umum === 0) ? [1, 0] : [bpjs, umum];
        let finalColor = (bpjs === 0 && umum === 0) ? ['#eee', '#eee'] : ['#48c774', '#3298dc'];

        chartInstanceGuarantor = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['BPJS', 'Umum'],
                datasets: [{
                    data: finalData,
                    backgroundColor: finalColor
                }]
            }
        });
    }
}