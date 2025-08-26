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

async function fetchBookMetadata(isbn) {
  if (!isbn) return alert("Enter ISBN");

  // Fetch from OpenLibrary
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, { redirect: 'follow' });
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    const book = data[`ISBN:${isbn}`]
    form.elements.namedItem("title").value = book.title || ""
    form.elements.namedItem("author").value = book.authors?.map((a)=>a.name).join(", ") || "";
    form.elements.namedItem("publisher").value = book.publishers?.map((a)=>a.name).join(', ') || ""
    form.elements.namedItem("year").value = book.publish_date || "";
    const cover = book.cover?.large || book.cover?.medium || book.cover?.small;
    if(cover) {
      form.elements.namedItem("cover_image_url").value
      preview.src = cover;
    }
    else {
      form.elements.namedItem("cover_image").hidden = false;
    }
  } catch (e) {
    debugger
    alert("Book not found, fill manually");
  }
}

scanBtn.addEventListener("click", async () => {
  //scan
  await fetchBookMetadata(isbnInput.value.trim())
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bookData = Object.fromEntries(new FormData(form).entries());
  bookData.isbn = isbnInput.value.trim();
  await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData)
  });
  alert("Saved!");
  form.reset();
  isbnInput.value = "";
});

