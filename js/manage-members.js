// 1. Initialize a  XMLHttpRequest Object
// const API_END_POINT='http://35.200.157.92:8080/lms/api';
const API_END_POINT = 'http://localhost:8080/lms/api';

const http = new XMLHttpRequest();
const pageSize = 5;
let page = 1;

getMembers();

// alert('okay');

// 2. Set an event listener to detect state change
function getMembers(query = `${$('#txt-search').val()}`) {  // if we do not pass a value the query will take the empty string

    http.addEventListener('readystatechange', () => {
        if (http.readyState === http.DONE) {
            if (http.status === 200) {
                const totalMembers = +http.getResponseHeader('X-Total-Count');
                console.log(totalMembers);
                // plus is puut to cast into an int + or -
                // console.log(http.responseText);
                initPagination(totalMembers);

                const members = JSON.parse(http.responseText);
                // console.log(members);
                $('#loader').hide();
                if (members.length === 0) {
                    $('#tbl-members').addClass('empty');
                } else {
                    $('#tbl-members').removeClass('empty');

                }
                $('#tbl-members tbody tr').remove();
                members.forEach(member => {
                    // console.log(member);
                    const rowHtml = `
            <tr tabindex="0">
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.address}</td>
                <td>${member.contact}</td>
            </tr>
            `;
                    $('#tbl-members tbody').append(rowHtml);
                });


                // $('#tbl-members tbody')
            } else {
                showToast("Failed to laod members by refreshing");
            }
        }
    });


    // 3. Open the request

    http.open('GET', `${API_END_POINT}/members?size=${pageSize}&page=${page}&q=${query}`, true);
    // http.open('GET','url of the real server when it is created/members',true);

    // 4.Set additional information for the request

    // 5. Send the request
    http.send();
}
function initPagination(totalMembers) {
    const totalPages = Math.ceil(totalMembers / pageSize);
    if (page > totalPages) {
        page = totalPages;
        getMembers();
        return;
    }
    if (totalPages <= 1) {
        $("#pagination").addClass('d-none');
    } else {
        $("#pagination").removeClass('d-none');
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#">${i}</a></li>`;
    }
    html = `
    <li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#">Previous</a></li>
    ${html}
    <li class="page-item ${page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#">Next</a></li>
    `;
    $('#pagination > .pagination').html(html);
}


$('#pagination > .pagination').click((eventData) => {
    const elm = eventData.target;
    if (elm && elm.tagName === 'A') {
        const activePage = ($(elm).text());
        if (activePage === 'Next') {
            page++;
            getMembers();
        } else if (activePage === 'Previous') {
            page--;
            getMembers();
        } else {
            if (page != activePage) {

                page = +activePage;
                getMembers();

            }
        }
    }
});

$('#txt-search').on('input', () => {
    page = 1;
    getMembers();
});

$('#tbl-members tbody').keyup((eventData) => {
    if (eventData.which === 38) {
        const elm = document.activeElement.previousElementSibling;
        if (elm instanceof HTMLTableRowElement) {
            elm.focus();
        }
    } else if (eventData.which === 40) {
        const elm = document.activeElement.nextElementSibling;
        if (elm instanceof HTMLTableRowElement) {
            elm.focus();
        }
    }
});
$(document).keyup((eventData) => {
    if (eventData.ctrlKey && eventData.key === '/') {
        $("#txt-search").focus();
    }
});

// $('#btn-new-member').click(() => {
//     const frmMemberDetail = new bootstrap.Modal(document.getElementById('frm-member-detail'));
//     frmMemberDetail.show();
// });

$("#btn-new-member").click(() => {
    const frmMemberDetail = new bootstrap.Modal(document.getElementById('frm-member-detail'));
    $("#frm-member-detail").removeClass('edit').addClass('new').on('shown.bs.modal', () => {
        $("#txt-name").focus();
    });
    $('#txt-id', '#txt-name', '#txt-address', '#txt-contact').attr('disabled', false).val('');
    frmMemberDetail.show();
});

$("#frm-member-detail form").submit((eventData) => {
    eventData.preventDefault();
    $("#btn-save").click()
});

$("#btn-save").click(async () => {
    console.log("clicked");
    const name = $("#txt-name").val();
    const address = $("#txt-address").val();
    const contact = $("txt-contact").val();
    let validated = true;

    $("#txt-name, #txt-address, #txt-contact").removeClass('is-invalid');
    if (!/^[A-Za-z ]+$/.test(contact)) {
        $("#txt-contact").addClass('is-invalid').select().focus();
        validated = false;
    }
    // if(!/^[A-Za-z0-9|,.:;#/\ -]+$/.test(address)){
    //     $("#txt-address").addClass('is-invalid').select().focus();
    //     validated = false;
    // }
    if (!/^[A-Za-z0-9#,.-;:/]+$/.test(address)) {
        $("#txt-address").addClass('is-invalid').select().focus();
        validated = false;
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
        $("#txt-name").addClass('is-invalid').select().focus();
        validated = false;
    }
    if (!validated) return;
    try {
        $("#overlay").removeClass("d-none");
        const { id } = await saveMember();  // asking to go inside the saveMember() method, and inside the 
        // saveMember() method it consume the web service and return the object that it saved in the database. After that here we extract the id using const {id} instead of getting the complete object
        $("#overlay").addClass("d-none");
        showToast(`Member has been Saved successfully with the ID :${id}`, 'success');   // here we put `` cause we wanna embed the id , if not embedding that we can use " "
        $("#txt-name", "#txt-address", "#txt-contact").val("");
        $("#txt-name").focus();
    } catch (e) {
        $("overlay").addClass("d-none");
        showToast("Failed to save the member");
        $("#txt-name").focus();
    }
});

$("#btn-edit").click(() => {
    $("#frm-member-detail").addClass('edit');

    $("#txt-name", "#txt-address", "txt-contact").attr('disabled', false);
});




/////////////////////////////////      ===================================================================================== check this await

$("#btn-delete").click(async () => {
    // fetch(`${API_END_POINT}/members/${}`).val();
    $("#over-lay").removeClass("d-none");

    try {
        const response=await fetch(`${API_END_POINT}/members/${$('#txt-id')}`,{method:'DELETE'});
        if(response.status === 204){
            showToast('Member has been deleted successfully','success');
            $("#btn-close").click();
            const frmMemberDetail=new bootstrap.Modal(document.getElementById('frm-member-detail'));
            frmMemberDetail.hide();
        }else{
            throw new Error(response.status);
        }
    } catch (error) {
        showToast("Failed to delete the member, Try again");
    } finally {
        $("#over-lay").addClass("d-none");
    }
});

$("#btn-update").click(async () => {
    $("#over-lay").removeClass("d-none");
    const name = $("#txt-name").val();
    const address = $("#txt-address").val();
    const contact = $("txt-contact").val();
    let validated = true;

    $("#txt-name, #txt-address, #txt-contact").removeClass('is-invalid');
    if (!/^[A-Za-z ]+$/.test(contact)) {
        $("#txt-contact").addClass('is-invalid').select().focus();
        validated = false;
    }
    if (!/^[A-Za-z0-9#,.-;:/]+$/.test(address)) {
        $("#txt-address").addClass('is-invalid').select().focus();
        validated = false;
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
        $("#txt-name").addClass('is-invalid').select().focus();
        validated = false;
    }
    if (!validated) return;
    try {
        const response = await fetch(`${API_END_POINT}/members/${$("#txt-id").val()}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: $("#txt-id").val(), name, address, contact
            })
        });
        if (response.status === 204) {
            showToast('Member has been successfully updated');
        } else {
            throw new Error(response.status);
        }
    } catch (error) {
        showToast('Failed to update the member, try again !');
    }finally {
        $("#over-lay").addClass("d-none");
    }
});



// function saveMember(){
// return new Promise((resolve,reject)=>{
//     setTimeout(()=>resolve(),5000);
// }); // in here resolve and reject are two functions if it is successfull then resolve function and if it is not successfull then reject function will run


// }
// doSomething();

// async function doSomething() {
//     try {
//         await saveMember();
//         console.log("Promise eka una");
//     } catch (e) {
//         console.log("Promise eka kale");
//     }


//     // const promise=saveMember(); // sometimes may be able to keep the status of the promise or may be not

//     // promise.then(()=>{
//     //     console.log("Kiwwa wagema kala");

//     // }).catch(()=>{
//     //     console.log("Promise eka kale");

//     // });
// }

function saveMember() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();  // open a request
        xhr.addEventListener('readystatechange', () => {   // add a listener to the request 
            if (xhr.readyState === XMLHttpRequest.DONE) {

                if (xhr.status === 201) {

                    resolve(JSON.parse(xhr.responseText));  // promise fulfilled and also parse the object saved as JSON object, which is converted into a JSON object through JSON.parse()

                } else {
                    reject();  // couldn't fulfill the promise
                }
            }
        });
        xhr.open('POST', `${API_END_POINT}/members`, true);  // sending the content type
        xhr.setRequestHeader('Content-Type', 'application/json');

        const member = {   // Java script object
            name: $("#txt-name").val(),
            address: $('#txt-address').val(),
            contact: $('#txt-contact').val()
        }
        xhr.send(JSON.stringify(member));  // converting the Java Script object to a JSON object

    });
}
function showToast(msg, msgType = 'warning') {
    $("#toast").removeClass('text-bg-warning')
        .removeClass('text-bg-primary')
        .removeClass('text-bg-error')
        .removeClass('text-bg-success');

    if (msgType === 'success') {
        $("#toast").addClass('text-bg-success');
    } else if (msg === 'error') {
        $("#toast").addClass('text-bg-error');

    } else if (msg === 'primary') {
        $("#toast").addClass('text-bg-primary');

    } else {
        $("#toast").addClass('text-bg-warning');

    }
    $("#toast .toast-body").text(msg);
    $("#toast").toast('show');
}


$("#frm-member-detail").on('hidden.bs.modal', () => {
    getMembers();
});

$('#tbl-members tbody').click(({ target }) => {
    if (!target) return;
    let rowElm = target.closest('tr');
    // if(target instanceof HTMLTableRowElement){
    //     rowElm=target;
    // }else if(target instanceof HTMLTableCellElement){
    //     rowElm=target.parentElement;
    // }else{
    //     return;
    // }
    console.log(rowElm.cells[0].innerText);
    getMemberDetails($(rowElm.cells[0]).text());
});

async function getMemberDetails(memberId) {
    try {
        const response = await fetch(`${API_END_POINT}/members/${memberId}`);
        if (response.ok) {
            const member = await response.json();
            const frmMemberDetail = new bootstrap.Modal(document.getElementById('frm-member-detail'));


            console.log(member.id, member.name, member.address, member.contact);
            $("#frm-member-detail").removeClass('new').removeClass('new');
            $("#txt-id").attr('disabled', 'true').val(member.id);
            $("#txt-name").attr('disabled', 'true').val(member.name);
            $("#txt-address").attr('disabled', 'true').val(member.address);
            $("#txt-address").attr('disabled', 'true').val(member.contact);


            frmMemberDetail.show();


        } else {
            throw new Error(response.status);
        }

    } catch (error) {
        showToast('Failed to fetch the member details');
    }
    // console.log("get member details",memberId);
    // const http=new XMLHttpRequest();
    // http.addEventListener('readystatechange',()=>{
    //     if(http.readyState===XMLHttpRequest.DONE){
    //         if(http.status=== 200){
    //             const member=JSON.parse(http.responseText);
    //             const frmMemberDetail = new bootstrap.Modal(document.getElementById('frm-member-detail'));

    //             console.log(member.id, member.name, member.address, member.contact);
    //             $("#frm-member-detail").removeClass('new');
    //             $("#txt-id").attr('disabled','true').val(member.id);
    //             $("#txt-name").attr('disabled','true').val(member.name);
    //             $("#txt-address").attr('disabled','true').val(member.address);
    //             $("#txt-address").attr('disabled','true').val(member.contact);


    //             frmMemberDetail.show();
    //         }else{
    //             showToast('Failed to fetch the member details');
    //         }
    //     }

    // });
    // http.open('GET',`${API_END_POINT}/members/${memberId}`,true);
    // http.send();

}