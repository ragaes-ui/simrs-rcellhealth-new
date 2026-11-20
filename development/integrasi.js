// File: integrasi.js

var integrasi = {
    view: function(vnode) {
        return m('.box', [
            m('h1.title', 'Menu Integrasi System'),
            m('p', 'Halaman ini sedang dalam pengembangan.'),
            
            // Logika untuk menampilkan konten berdasarkan submenu yang diklik
            m('.notification.is-info', 
              'Anda sedang membuka menu: ' + (state.route || 'Utama')
            ),

            // Contoh Konten untuk Cek Peserta
            state.route === 'cekPeserta' ? m('div', [
                m('h3.subtitle', 'Cek Peserta BPJS'),
                m('input.input', {placeholder: 'Masukkan NIK/No Kartu'}),
                m('button.button.is-primary.mt-2', 'Cek Data')
            ]) : null
        ]);
    }
};