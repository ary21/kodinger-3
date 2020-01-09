let posts = Kodinger.API.Post.init('.posts', {
    url: routes.discover,
    carousel: false,
    truncate_content: true,
    lazyimage: false,
    type: Kodinger.API.Post.TYPE.DISCOVER
});

let tagify = new Tagify($('.tags'), {
    enforceWhitelist : true,
    whitelist        : [],
    maxTags: 5,
    skipInvalid: true,
    dropdown : {
            highlightFirst: true,
            maxItems: 7
    },
    placeholder: 'Pilih maksimal 5 tag',
    templates : {
        wrapper(input, settings){
            return `<tags class="tagify focus-within:border-indigo-600 ${settings.mode ? "tagify--" + settings.mode : ""} ${input.className}"
                                                    ${settings.readonly ? 'readonly aria-readonly="true"' : 'aria-haspopup="listbox" aria-expanded="false"'}
                                                    role="tagslist">
                                    <span contenteditable data-placeholder="${settings.placeholder || '&#8203;'}" aria-placeholder="${settings.placeholder || ''}"
                                            class="tagify__input p-0 m-0 py-1"
                                            role="textbox"
                                            aria-controls="dropdown"
                                            aria-autocomplete="both"
                                            aria-multiline="${settings.mode=='mix'?true:false}"></span>
                            </tags>`
        },

        tag(value, tagData){
                return `<tag title='${tagData.title || value}'
                                    contenteditable='false'
                                    spellcheck='false'
                                    class='tagify__tag m-0 mr-2 rounded ${tagData.class ? tagData.class : ""}'
                                    ${this.getAttributes(tagData)}>
                        <x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>
                        <div>
                                <span class='tagify__tag-text'>${value}</span>
                        </div>
                </tag>`
        },

        dropdownItem( item ){
            var mapValueTo = this.settings.dropdown.mapValueTo,
                    value = (mapValueTo
                            ? typeof mapValueTo == 'function'
                                    ? mapValueTo(item)
                                    : item[mapValueTo]
                            : item.value) || item.value,
                    sanitizedValue = (value || item).replace(/`|'/g, "&#39;");

            return `<div ${this.getAttributes(item)}
                                    class='tagify__dropdown__item text-sm px-4 ${item.class ? item.class : ""}'
                                    tabindex="0"
                                    role="option"
                                    aria-labelledby="dropdown-label">${sanitizedValue}</div>`;
        }
    }
}), controller;

tagify.on('input', onInput)

function onInput( e ){
    var value = e.detail.value;
    tagify.settings.whitelist.length = 0;

    controller && controller.abort();
    controller = new AbortController();

    tagify.loading(true).dropdown.hide.call(tagify)

    fetch(routes.post_tags + '?value=' + value, {signal:controller.signal})
    .then(RES => RES.json())
    .then(function(whitelist){
        tagify.settings.whitelist.splice(0, whitelist.length, ...whitelist)
        tagify.loading(false).dropdown.show.call(tagify, value);
    })
}

$('#discover-form').addEventListener('submit', function(e) {
    let link = $('.input-link'),
        form = this,
        tags = tagify.value,
        btn = $('.publish-button');

    const shimmer = posts.shimmer.add();

    let tag_ids = '';
    tags.forEach(function(item){
        tag_ids += item.id + ',';
    });
    tag_ids = tag_ids.replace(/,+$/g,"");

    if(link.value.trim().length < 1 || !validateUrl(link.value)) {
        link.focus();
    } else if(tags.length < 1) {
        tagify.DOM.input.focus();
    } else {
        adds(btn.classList, 'pointer-events-none opacity-50');
        btn.disabled = true;

        window.scrollTo({
            top: $('.posts').offsetTop -50
        });

        const posting = (async function() {
            const res = await fetch(routes.post_store_discover, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    pages: link.value,
                    tags: tag_ids
                })
            });

            return Promise.resolve(res);
        })()
        // on complete
        .then(function(res) {
            removes(btn.classList, 'pointer-events-none opacity-50');
            btn.disabled = false;

            if(res.ok) {
                return Promise.resolve(res.json());
            }

            return Promise.reject(res);
        })
        .then(function(res) {            
            form.reset();
            tagify.removeAllTags();

            posts.append({
                data: res
            }, true).catch(function(err) {
                console.log(err)
            });

            shimmer.dispose();
        })
        .catch(function(error) {
            shimmer.dispose();

            if(error.status == 401)
                showLoginAlert();
        });
    }

    e.preventDefault();
});
