let search = $('#search').val();

function searchActive() {
    $('#search-nav #search')
        .addClass('border-white')
        .removeClass('border-transparent');
    $('#search-mob #search-mobile')
        .addClass('border-white')
        .removeClass('border-transparent');

    $('#search-nav #submit-search')
        .addClass('text-white scale-110')
        .removeClass('text-slate-400');
    $('#search-mob #submit-search-mobile')
        .addClass('text-white scale-110')
        .removeClass('text-slate-400');
}

function searchInactive() {
    $('#search-nav #search')
        .addClass('border-transparent')
        .removeClass('border-white');
    $('#search-mob #search-mobile')
        .addClass('border-transparent')
        .removeClass('border-white');

    $('#search-nav #submit-search')
        .addClass('text-slate-400')
        .removeClass('text-white scale-110');
    $('#search-mob #submit-search-mobile')
        .addClass('text-slate-400')
        .removeClass('text-white scale-110');
}

if (search) {
    searchActive();
} else {
    searchInactive();
}

$('#search, #search-mobile').on('change', function () {
    $('#search').val($(this).val());
    $('#search-mobile').val($(this).val());
    if ($(this).val()) {
        searchActive();
    } else {
        searchInactive();
    }
});

$('#search-nav, #search-mob').on('submit', function (e) {
    e.preventDefault();
    const keyword = $('#search').val().toLowerCase().trim();
    filterGallery(keyword);
});

$('#search, #search-mobile').on('input', function () {
    const keyword = $(this).val().toLowerCase().trim();
    filterGallery(keyword);
});

function filterGallery(keyword) {
    let found = false;

    $('.gallery-item').each(function () {
        const name = $(this).data('name').toLowerCase();
        if (name.includes(keyword)) {
            $(this).show();
            found = true;
        } else {
            $(this).hide();
        }
    });

    if (found) {
        $('#not-found').hide();
    } else {
        $('#not-found').show();
    }
}

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('search');
if (searchQuery) {
    $('#search').val(searchQuery);
    $('#search-mobile').val(searchQuery);
    filterGallery(searchQuery.toLowerCase().trim());
}