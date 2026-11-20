/*global _ comp m state menus look collNames db gapi dbCall withAs io autoForm schemas moment getDifferences betaMenus ors ands selects randomColor makeIconLabel defaultTheme*/

var topMenus = _.omit(menus, ['gizi', 'telemed'])
// ====================================================================
// 1. LOGIKA PENDAFTARAN HALAMAN IFRAME (ANAK MENU)
//    (Bagian ini membuat halaman: Cek Peserta, Koding, SEP, dll)
// ====================================================================

// --- Logic Anak Menu: Integrasi System ---
if (menus.integrasiSystem && menus.integrasiSystem.children) {
    _.assign(comp, _.mapValues(menus.integrasiSystem.children, (item) => 
        () => {
            var userRole = +_.get(state, 'login.peranan');
            if (![4, 1].includes(userRole)) { // Role: Admin & Manajemen
                return m('.notification.is-danger.m-6', [
                    m('h1.title', 'Akses Ditolak!'),
                    m('p', 'Role Anda (' + userRole + ') tidak memiliki izin.'),
                    m('button.button.is-light.mt-4', {onclick: () => state.route = 'dashboard'}, 'Kembali ke Dashboard')
                ]);
            }
            return m('.box', {style: 'min-height: 85vh; padding: 0; overflow: hidden;'}, [
                item.url ? m('iframe', {
                    src: item.url,
                    style: { width: '100%', height: '100%', border: 'none', display: 'block' }
                }) : m('.notification.is-warning.m-4', 'URL file belum disetting di functions.js')
            ]);
        }
    ));
}

// --- Logic Anak Menu: Berkas Pasien ---
if (menus.Berkaspasien && menus.Berkaspasien.children) {
    _.assign(comp, _.mapValues(menus.Berkaspasien.children, (item) => 
        () => {
            var userRole = +_.get(state, 'login.peranan');
            if (![4, 1].includes(userRole)) { // Role: Admin & Rekam Medis
                return m('.notification.is-danger.m-6', [
                    m('h1.title.has-text-white', 'Akses Ditolak!'),
                    m('p', 'Maaf, menu ini khusus untuk Petugas Rekam Medis & Admin.'),
                    m('button.button.is-light.mt-4', {onclick: () => state.route = 'dashboard'}, 'Kembali ke Dashboard')
                ]);
            }
            return m('.box', {style: 'min-height: 85vh; padding: 0; overflow: hidden;'}, [
                item.url ? m('iframe', {
                    src: item.url,
                    style: { width: '100%', height: '100%', border: 'none', display: 'block' }
                }) : m('.notification.is-info.m-6', [
                    m('h3.title', 'Halaman Sedang Disiapkan'),
                    m('p', 'File HTML belum dihubungkan di functions.js')
                ])
            ]);
        }
    ));
}

// ====================================================================
// 2. DEFINISI TAMPILAN UTAMA (MENU & DASHBOARD)
// ====================================================================

_.assign(comp, {

    // --- A. MENU INTEGRASI SYSTEM (Tampilan Kotak Biru) ---
    integrasiSystem: () => m('.content',
        m('.level', [
            m('.level-left', m('h2.level-item', [
                m('span.icon.mr-2.has-text-primary', m('i.fas.fa-cogs')), 
                'Menu Integrasi System'
            ])),
            m('.level-right', m('button.button.is-warning.is-light', {
                onclick: () => state.route = 'dashboard'
            }, [m('span.icon', m('i.fas.fa-arrow-left')), m('span', 'Kembali')]))
        ]),
        m('.box', {style: 'background-color: #f9f9f9; border-top: 3px solid #00d1b2;'},
            m('.columns.is-multiline', 
                _.map(menus.integrasiSystem.children, (val, key) => 
                    m('.column.is-4', m('.card', {
                        style: 'cursor: pointer; transition: transform 0.2s;',
                        onmouseover: function() { this.style.transform = 'scale(1.05)'; },
                        onmouseout: function() { this.style.transform = 'scale(1)'; },
                        onclick: () => { state.route = key; m.redraw(); }
                    }, m('.card-content.has-text-centered', [
                        m('span.icon.is-large.has-text-primary.mb-3', m('i.fas.fa-3x.fa-' + val.icon)),
                        m('h4.title.is-5', val.full),
                        m('p.subtitle.is-7', 'Klik untuk membuka')
                    ])))
                )
            )
        )
    ),

    // --- B. MENU BERKAS PASIEN (Tampilan Kotak Hijau - INI YANG ANDA CARI) ---
    Berkaspasien: () => m('.content',
        m('.level', [
            m('.level-left', m('h2.level-item', [
                m('span.icon.mr-2.has-text-success', m('i.fas.fa-folder-open')), 
                'Menu Berkas Pasien'
            ])),
            m('.level-right', m('button.button.is-warning.is-light', {
                onclick: () => state.route = 'dashboard'
            }, [m('span.icon', m('i.fas.fa-arrow-left')), m('span', 'Kembali')]))
        ]),
        m('.box', {style: 'background-color: #f9f9f9; border-top: 3px solid #23d160;'},
            m('.columns.is-multiline', 
                _.map(menus.Berkaspasien.children, (val, key) => 
                    m('.column.is-4', m('.card', {
                        style: 'cursor: pointer; transition: transform 0.2s;',
                        onmouseover: function() { this.style.transform = 'scale(1.05)'; },
                        onmouseout: function() { this.style.transform = 'scale(1)'; },
                        onclick: () => { state.route = key; m.redraw(); }
                    }, m('.card-content.has-text-centered', [
                        m('span.icon.is-large.has-text-success.mb-3', m('i.fas.fa-3x.fa-' + val.icon)),
                        m('h4.title.is-5', val.full),
                        m('p.subtitle.is-7', 'Kelola Data Rekam Medis')
                    ])))
                )
            )
        )
    ),
  navbar: () => m('nav.navbar.is-primary.is-fixed-top',
    m('.navbar-brand',
      m('a.navbar-item',
        {onclick: () => state.route = 'dashboard'},
        'SIMRS.RCELLHEALTH + (DEV)'
      ),
      m('.navbar-burger',
        {
          role: 'button', class: state.burgerMenu && 'is-active',
          onclick: () => state.burgerMenu = !state.burgerMenu
        },
        _.range(3).map(i => m('span', {'aria-hidden': true}))
      )
    ),
    m('.navbar-menu',
      {class: state.burgerMenu && 'is-active'},
      m('.navbar-start', _.map(topMenus, (val, key) =>
        m('a.navbar-item',
          {
            class: val.children && 'has-dropdown is-hoverable',
            onclick: () => [_.assign(state, {
              route: key, burgerMenu: null
            }), m.redraw()]
          },
          val.children ? [
            m('a.navbar-link', _.startCase(val.full)),
            m('.navbar-dropdown', _.map(val.children, (i, j) =>
              m('a.navbar-item',
                {onclick: e => [
                  e.stopPropagation(), _.assign(state, {
                    route: j, burgerMenu: null
                  })
                ]},
                makeIconLabel(i.icon, i.full)
               )
            ))
          ] : m('span', _.startCase(val.full))
        )
      )),
      state.login &&
      m('.navbar-end', m('.navbar-item.has-dropdown.is-hoverable',
        m('a.navbar-link', {
          onclick: () => [state.route = 'profile', m.redraw()]
        }, _.get(state.login, 'nama')),
        m('.navbar-dropdown.is-right',
          m('a.navbar-item',
            makeIconLabel('user-tag', 'Peranan: '+ look('peranan', _.get(state.login, 'peranan')))
          ),
          m('a.navbar-item',
            makeIconLabel('shapes', 'Bidang: '+look('bidang', _.get(state.login, 'bidang')))
          ),
          m('a.navbar-item',
            makeIconLabel('clinic-medical', 'Poliklinik: '+look('klinik', _.get(state.login, 'poliklinik')))
          ),
          m('hr.dropdown-divider'),
          // +++++++++++++ AWAL TAMBAHAN TOMBOL BANTUAN +++++++++++++
          m('a.navbar-item',
            {
              // Arahkan ke email admin/dukungan Anda
              href: 'mailto:052707296@ecampus.ut.ac.id?subject=Bantuan SIMRS RCELLHEALTH',
              target: '_blank'
            },
            // Gunakan icon 'question-circle' dari Font Awesome
            makeIconLabel('question-circle', 'Bantuan')
          ),
// +++++++++++++ AKHIR TAMBAHAN TOMBOL BANTUAN +++++++++++++
          m('a.navbar-item',
            {onclick: () => [
              _.assign(state, {
                login: null, route: 'login', loading: false,
                burgerMenu: null,
                                // +++++++++++++ TAMBAHAN PESAN SUKSES +++++++++++++
                success: 'Logout berhasil. Terimakasih telah menggunakan aplikasi kami!'
                // +++++++++++++++++++++++++++++++++++++++++++++++++
              }),
              localStorage.removeItem('login'),
                            // +++++++++++++ TAMBAHAN TIMEOUT +++++++++++++
              // Atur timeout untuk menghilangkan notif sukses setelah 3 detik
              setTimeout(() => {
                state.success = null;
            m.redraw();
              }, 3000), // 3000 milidetik = 3 detik
              // ++++++++++++++++++++++++++++++++++++++++++++
              m.redraw()
            ]},
            makeIconLabel('sign-out-alt', 'Logout')
          )
        )
      ))
    )
  ),

  dashboard: () => m('.content',
    m('h1', {oncreate: () => [
      getDifferences(),
      db.users.toArray(array =>
        state.userList = array
      )
    ]}, 'Dashboard'),
    m('.buttons',
      m('.button.is-info', {
        class: state.loading ? 'is-loading' : '',
        "data-tooltip": 'otomatis setiap beberapa menit / manual',
        onclick: () => [state.loading = true, getDifferences()]
      }, 'Sync'),
      state.lastSync && m('span',
        'Tersinkronisasi ' + moment(state.lastSync).fromNow()
      ),
    ),
    _.chunk(_.map(menus, (v, k) => [v, k]), 3).map(i =>
      m('.columns', i.map(j => m('.column',
        m('a.box', m('article.media',
          {onclick: () => [state.route = j[1], m.redraw()]},
          m('.media-left', m('span.icon.has-text-primary',
            m('i.fas.fa-2x.fa-'+j[0].icon))
          ),
          m('.media-content', m('.content',m('h3', j[0].full)))
        ))
      )))
    ),
    m('h1', 'Statistik Sistem'),
    m('.tabs.is-boxed', m('ul',
      {style: 'margin-left: 0%'},
      _.map({
        pasien: ['Pasien', 'walking'],
        rawatJalan: ['Rawat Jalan', 'ambulance'],
        emergency: ['Emergency', 'heart'],
        rawatInap: ['Rawat Inap', 'bed'],
        radiology: ['Radiologi', 'radiation'],
        laboratory: ['Laboratorium', 'flask'],
        storage: ['Gudang', 'cubes'],
        management: ['Management', 'users']
      }, (val, key) => m('li',
        {class: key === state.dashboardTab && 'is-active'},
        m('a',
          {onclick: () => [state.dashboardTab = key, m.redraw()]},
          makeIconLabel(val[1], val[0])
        )
      ))
    )),
    m('.columns', {
      oncreate: () => [
        db.patients.toArray(array => _.merge(state, {stats: {
          pasien: {
            total: array.length,
            pria: array.filter(i => i.identitas.kelamin === 1).length,
            wanita: array.filter(i => i.identitas.kelamin === 2).length
          },
          rawatJalan: selects('klinik')().map(
            i => _.sum(array.map(
              j => (j.rawatJalan || []).filter(
                k => k.klinik === i.value
              ).length
            ).filter(Boolean))
          ),
          emergency: _.sum(array.map(i => (i.emergency || []).length)),
          rawatInap: _.sum(array.map(i => (i.rawatInap || []).length)),
          radiology: _.flattenDeep(array.map(i => [
            ...i.rawatJalan || [],
            ...i.emergency || [],
            ...(i.rawatInap || []).flatMap(i => i.observasi) || []
          ].map(j => _.get(j, 'soapDokter.radio')).filter(Boolean))).length,
          laboratory: _.flattenDeep(array.map(i => [
            ...i.rawatJalan || [],
            ...i.emergency || [],
            ...(i.rawatInap || []).flatMap(i => i.observasi) || []
          ].map(j => _.get(j, 'soapDokter.labor')).filter(Boolean))).length
        }})),
        db.goods.toArray(array => _.merge(state, {stats: {
          barang: {
            obat: array.filter(i => i.jenis === 1).length,
            bhp: array.filter(i => i.jenis === 2).length,
            batch: array.flatMap(i => i.batch).length
          }
        }})),
        db.users.toArray(array => _.merge(state, {stats: {
          management: {
            petugas: array.filter(i => i.peranan === 1).length,
            perawat: array.filter(i => i.peranan === 2).length,
            dokter: array.filter(i => i.peranan === 3).length,
            admin: array.filter(i => i.peranan === 4).length
          }
        }}))
      ]
    }, ({
      pasien: [
        'Total jumlah pasien: '+_.get(state, 'stats.pasien.total'),
        'Total pasien pria: '+_.get(state, 'stats.pasien.pria'),
        'Total pasien wanita: '+_.get(state, 'stats.pasien.wanita')
      ],
      rawatJalan: selects('klinik')().map(i => [
        'Total pasien klinik ', i.label, ': ',
        _.get(state, ['stats', 'rawatJalan', i.value-1])
      ].join('')),
      emergency: ['Total pasien emergency: '+_.get(state, 'stats.emergency')],
      rawatInap: ['Total pasien pernah inap: '+_.get(state, 'stats.rawatInap') ],
      radiology: ['Total riwayat layanan radiologi: '+_.get(state, 'stats.radiology')],
      laboratory: ['Total riwayat layanan laboratorium: '+_.get(state, 'stats.laboratory')],
      storage: [
        'Jumlah obat terdaftar: '+_.get(state, 'stats.barang.obat'),
        'Jumlah BHP terdaftar: '+_.get(state, 'stats.barang.bhp'),
        'Jumlah batch terdaftar: '+_.get(state, 'stats.barang.batch')
      ],
      management: [
        'Jumlah petugas: '+_.get(state, 'stats.management.petugas'),
        'Jumlah perawat: '+_.get(state, 'stats.management.perawat'),
        'Jumlah dokter: '+_.get(state, 'stats.management.dokter')
      ]
    })[state.dashboardTab || 'pasien']
    .map(i => m('.column', m('.notification',
      {class: 'is-primary'}, i
    ))))
  ),

  login: () => m('.content', m('.columns',
    m('.column'),
    m('.column',
      !ors([
        window.chrome, typeof(InstallTrigger) === 'object'
      ]) && m('.notification.is-warning.is-light',
        'Mohon gunakan Chrome/Firefox terbaru'
      ),
      state.error && m('.notification.is-danger.is-light', [
        m('button.delete', {onclick: () => state.error = false}),
        state.error
      ]),
      _.range(3).map(() => m('br')),
      m('.level', m('.level-item.has-text-centered',
        m('span.icon.is-large.has-text-primary', m('i.fas.fa-8x.fa-stethoscope'))
      )), m('br'),
      m(autoForm({
        id: 'login', schema: schemas.login,
        submit: {
          value: 'Login',
          class: state.loading ? 'is-info is-loading' : 'is-info'
        },
// +++++++++++++ AWAL PERUBAHAN +++++++++++++
        action: doc => [
          state.loading = true, m.redraw(),
          io().emit('login', doc, (response) => {
            if (response.res) {
              // Jika login berhasil
              _.assign(state, {
                username: doc.username,
                route: 'dashboard',
                login: response.res,
                error: null,
                // +++++++++++++ TAMBAHKAN BARIS INI +++++++++++++
                success: 'Login berhasil! Selamat datang, ' + response.res.nama
// +++++++++++++++++++++++++++++++++++++++++++++++
              });
              localStorage.setItem('login', JSON.stringify(response.res));
              // +++++++++++++ TAMBAHKAN BLOK INI ++++++++++++++
              // Atur timeout untuk menghilangkan notif sukses setelah 3 detik
              setTimeout(() => {
                state.success = null;
                m.redraw();
              }, 3000); // 3000 milidetik = 3 detik
// +++++++++++++++++++++++++++++++++++++++++++++++
              m.redraw();
            } else {
              // Jika login gagal
              _.assign(state, {
                login: false,
                // Gunakan pesan error dari server, atau pesan default jika tidak ada
                error: response.error || 'Login Gagal, Username atau password salah, silahkan coba kembali !',
                loading: false, // Pastikan loading berhenti
              });
              m.redraw();
// UBAH 'setTimeout' DI BAWAH INI
              // Ini akan menghilangkan notifikasi error (merah) setelah 3 detik
              setTimeout(() => {
                state.error = null; // GANTI 'state.loginError' MENJADI 'state.error'
                m.redraw();
_             }, 3000); // 3000ms = 3 detik
// +++++++++++++ AKHIR TAMBAHAN (Hapus Shake) +++++++++++++
            }
          })
        ]
        // +++++++++++++ AKHIR PERUBAHAN +++++++++++++
      })),
            m('.column', [
        m('input[type="checkbox"]', {
          id: 'rememberMe',
          checked: state.rememberMe,
          onchange: (e) => state.rememberMe = e.target.checked
        }),
        m('label', { for: 'rememberMe' }, 'Remember Me')
      ]),
m('div.has-text-centered.mt-4',
  m('a', { 
    href: '#', 
    style: { textDecoration: 'none', color: '#3298dc', fontWeight: '600' },
    onclick: (e) => {
      e.preventDefault();
      
      // --- VERSI AMAN (Tanpa Gambar Eksternal & Animasi Berat) ---
      if (typeof Swal === 'undefined') {
          alert("Library SweetAlert belum terpasang di index.html!");
          return;
      }

      Swal.fire({
        icon: 'info', // Pakai icon bawaan biar aman
        title: 'Lupa Kata Sandi?',
        html: `
          <div style="font-size: 0.95rem; color:#555;">
            Silahkan hubungi administrator aplikasi, jika anda lupa password.<br><br>
            Atau Hubungi <b>IT Support</b> (Ext. 361) untuk reset password.
          </div>
        `,
        confirmButtonText: 'Baik, Mengerti',
        confirmButtonColor: '#3298dc',
        backdrop: `rgba(0,0,0,0.5)` // Latar belakang gelap biasa
      });
    }
  }, 'Forgot your Password?')
)
    ),
    m('.column')
  ))
});
io().on('connect', socket => [
  state.login = localStorage.login &&
    JSON.parse(localStorage.login || '{}'),
  m.mount(document.body, {view: () => m('div',
    {class: ors([
      _.includes([
        // semua latar terang diberi background grey
        'default', 'cerulean', 'cosmo',
        'journal', 'litera', 'lumen', 'lux',
        'materia', 'pulse', 'sandstone', 'simplex',
        'spacelab', 'united', 'yeti'
      ], localStorage.bulmaTheme || defaultTheme),
      !Boolean(localStorage.bulmaTheme)
    ]) && 'has-background-light'},
  // Notifikasi error untuk koneksi terputus
  state.error && m('.notification.is-danger.is-light', [
    m('button.delete', { onclick: () => state.error = false }),
    state.error
  ]),
  // +++++++++++++ TAMBAHKAN BLOK INI ++++++++++++++
  // Notifikasi sukses
  state.success && m('.notification.is-success.is-light', [
    m('button.delete', { onclick: () => state.success = null }),
    state.success
  ]),
// +++++++++++++++++++++++++++++++++++++++++++++++
    comp.navbar(), m('section.section', m('.container',
      {style: 'min-height:100vh'},
      state.username || _.get(state, 'login.username') ?
      comp[state.route]() : comp.login()
    )),
    m('footer.footer',
      {style: 'padding:0px'},
      m('.content', m('a.help.has-text-grey', {
        href: 'https://github.com/ragaes-ui/simrs.git',
        target: '_blank',
        style: 'text-align:center'
      }, 'Copyright: RCELLHEALTH + BY RAGA IT KIS (2023); Versi 4.8.0'))
    ),
    m('.content', {
      style: 'text-align:center; font-size: 18px; color: #aaa;'
    }, 'COLLABORATION BY: RCELLCLOUD-INC'),
// +++++++++++++ AWAL TOMBOL BANTUAN MENGAMBANG (DENGAN EFEK) +++++++++++++
    // Tombol ini hanya akan muncul jika pengguna sudah login
    m('div.fab-wrapper', {
        // Style untuk wrapper (pembungkus)
        style: {
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          'z-index': 999,
          display: 'flex',
          'align-items': 'center'
        },
        // Event handler untuk seluruh area (tombol + label)
        onmouseover: () => state.fabHover = true,
        onmouseout: () => state.fabHover = false
      },
        [ // Array yang berisi label dan tombol
          // 1. Label Bantuan (muncul saat state.fabHover true)
          state.fabHover && m('span.tag.is-dark.is-medium', {
            style: {
              marginRight: '10px',
              // Efek transisi untuk muncul
              transition: 'opacity 0.2s ease-in-out',
              opacity: state.fabHover ? 1 : 0 // Muncul perlahan
            }
          }, 'Butuh Bantuan?'),

          // 2. Tombol FAB (Tombol Tanda Tanya)
          m('a.button.is-primary.is-rounded.is-large', {
            style: {
              // Efek transisi untuk membesar
              transition: 'transform 0.2s ease-in-out',
              // Efek membesar saat state.fabHover true
              transform: state.fabHover ? 'scale(1.15)' : 'scale(1)',
              'box-shadow': '0 3px 8px rgba(0,0,0,0.2)' // Beri sedikit bayangan
            },
            href: 'mailto:052707296@ecampus.ut.ac.id?subject=Bantuan SIMRS RCELLHEALTH',
            target: '_blank',
            title: 'Butuh Bantuan?' // Tetap ada title untuk aksesibilitas
          },
            m('span.icon',
              m('i.fas.fa-question-circle.fa-lg')
            )
          )
        ]
    ),
// +++++++++++++ AKHIR TOMBOL BANTUAN MENGAMBANG (DENGAN EFEK) +++++++++++++
    m('link', {rel: 'stylesheet', href:'https://unpkg.com/bulmaswatch/'+
      (localStorage.bulmaTheme || defaultTheme)
    +'/bulmaswatch.min.css'})
  )}),
  // setiap kali data berubah, beritahu server untuk update seluruh klien yg sedang terkoneksi
  io().on('datachange', (name, doc) => [
    db[name].put(doc), state.lastSync = _.now(), m.redraw()
  ]),
  // Tambahkan event handler disconnect di bawah sini 
io().on('disconnect', () => {
  state.error = "Koneksi ke server database terputus. Mohon periksa konfigurasi database anda.";
  m.redraw(); // Perbarui tampilan
})
]);
