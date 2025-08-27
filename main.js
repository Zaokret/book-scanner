let books = []
const isbnInput = document.getElementById("isbn");
const scanBtn = document.getElementById("fetch");
const form = document.getElementById("book-form");
const preview = document.getElementById('preview');
window.addEventListener('DOMContentLoaded', function () {
      let selectedDeviceId;
      const codeReader = new ZXing.BrowserMultiFormatReader()
      console.log('ZXing code reader initialized')
      codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
          const sourceSelect = document.getElementById('sourceSelect')
          selectedDeviceId = videoInputDevices[0].deviceId
          if (videoInputDevices.length >= 1) {
            videoInputDevices.forEach((element) => {
              const sourceOption = document.createElement('option')
              sourceOption.text = element.label
              sourceOption.value = element.deviceId
              sourceSelect.appendChild(sourceOption)
            })

            sourceSelect.onchange = () => {
              selectedDeviceId = sourceSelect.value;
            };

            const sourceSelectPanel = document.getElementById('sourceSelectPanel')
            sourceSelectPanel.style.display = 'block'
          }

          document.getElementById('startButton').addEventListener('click', () => {
            codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
              if (result) {
                console.log(result)
                document.getElementById('result').textContent = result.text
                document.getElementById("isbn").value = result.text
              }
              if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err)
                document.getElementById('result').textContent = err
              }
            })
            console.log(`Started continous decode from camera with id ${selectedDeviceId}`)
          })

          document.getElementById('resetButton').addEventListener('click', () => {
            codeReader.reset()
            document.getElementById('result').textContent = '';
            console.log('Reset.')
          })

        })
        .catch((err) => {
          console.error(err)
        })
    })

function updateTable() {
const tbody = document.querySelector("#books-table tbody");
  tbody.innerHTML = "";
  books.forEach(book => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${book.isbn}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.publisher}</td>
      <td>${book.year}</td>
      <th>${book.price}</th>
      <td><img src="${book.cover_image_url}" alt="${book.title}"></td>
    `;

    tbody.appendChild(tr);
  });
  }

function downloadBooksCSV() {
    // headers
    const headers = ["isbn","title","author","publisher","year","price",  "cover_image_url"];

    // rows
    const rows = books.map(b => [
      String(b.isbn),
      b.title,
      b.author,
      b.publisher,
      b.year,
      b.price,
      b.cover_image_url
    ]);

    // escape CSV cells
    const escapeCSV = (val) => {
      if (val == null) return "";
      const str = String(val);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(escapeCSV).join(","))
    ].join("\n");

    // make blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "books.csv";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

const downloadCsv = document.getElementById('download-csv')
downloadCsv.addEventListener('click', () => downloadBooksCSV())

async function fetchBookMetadata(isbn) {
  if (!isbn) return alert("Enter ISBN");

const book = await fetch(`https://bookstore-proxy-eta.vercel.app/api/books?isbn=${isbn}`).then(res => res.json())
    if(!book) return alert("Book not found, fill manually")
    form.elements.namedItem("title").value = book.title || ""
    form.elements.namedItem("author").value = book.author || "";
    form.elements.namedItem("publisher").value = book.publisher || ""
    form.elements.namedItem("year").value = book.year || "";
    const cover = book.cover_image_url;
    if(cover) {
      form.elements.namedItem("cover_image_url").value
      preview.src = cover;
    }
    else {
      form.elements.namedItem("cover_image").hidden = false;
    }

  // // Fetch from OpenLibrary
  // try {


  //   const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, { redirect: 'follow' });
  //   if (!res.ok) throw new Error("Not found");
  //   const data = await res.json();
  //   const book = data[`ISBN:${isbn}`]
  //   form.elements.namedItem("title").value = book.title || ""
  //   form.elements.namedItem("author").value = book.authors?.map((a)=>a.name).join(", ") || "";
  //   form.elements.namedItem("publisher").value = book.publishers?.map((a)=>a.name).join(', ') || ""
  //   form.elements.namedItem("year").value = book.publish_date || "";
  //   const cover = book.cover?.large || book.cover?.medium || book.cover?.small;
  //   if(cover) {
  //     form.elements.namedItem("cover_image_url").value
  //     preview.src = cover;
  //   }
  //   else {
  //     form.elements.namedItem("cover_image").hidden = false;
  //   }
  // } catch (e) {
  //   debugger
  //   alert("Book not found, fill manually");
  // }
}

scanBtn.addEventListener("click", async () => {
  //scan
  await fetchBookMetadata(isbnInput.value.trim())
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bookData = Object.fromEntries(new FormData(form).entries());
  bookData.isbn = isbnInput.value.trim();
  bookData.cover_image = bookData.cover_image?.name || ""
  books.push(bookData)
  updateTable()
  form.reset();
  isbnInput.value = "";
});




