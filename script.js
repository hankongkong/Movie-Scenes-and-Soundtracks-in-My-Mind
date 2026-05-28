// 🌟 1. 영화 데이터 담을 전역 변수 (API로 불러올 예정)
let movies = [];

// 🌟 2. 3D 지구본 캐러셀 및 상호작용 기능
const movieGrid = document.getElementById("movie-grid");
let currentPlayingIndex = null;
let currAngle = 0;
let autoPlayTimer = null;
let initialStartTimer = null;
let isWheeling = false;

function initGenreDisplay(selectedGenre) {
    // 🚨 BUG FIX 1: 장르 변경 시 무조건 화면 맨 위로!
    window.scrollTo(0, 0); 
    // 🚨 BUG FIX 2: 3D 캐러셀용 스크롤 금지 이벤트를 강제로 삭제 (전체 영화 탭 휠 먹통 해결)
    movieGrid.onwheel = null; 

    clearInterval(autoPlayTimer);
    clearTimeout(initialStartTimer);
    
    movieGrid.innerHTML = "";
    currentPlayingIndex = null;
    currAngle = 0;

    // 🌟 L2. [CSS Grid] 전체 영화 탭을 눌렀을 때의 렌더링 로직
    if (selectedGenre === "ALL") {
        movieGrid.style.backgroundImage = "none";
        movieGrid.style.display = "block"; 
        movieGrid.style.height = "auto";
        movieGrid.style.paddingBottom = "50px";

        const gridContainer = document.createElement("div");
        gridContainer.className = "movie-grid-view";

        // 🌟 장르 코드를 예쁜 풀네임으로 바꿔주는 매핑 객체 추가!
        const genreNames = {
            "SF_TIME": "SF / TIME",
            "THRILLER": "MYSTERY / THRILLER",
            "ROMANCE": "MUSIC / ROMANCE",
            "DRAMA": "DRAMA / HUMAN"
        };

        movies.forEach((movie) => {
            const item = document.createElement("div");
            item.className = "grid-item";
            // 🌟 movie.genre 대신 genreNames[movie.genre]를 사용해서 풀네임 출력
            item.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>장르: ${genreNames[movie.genre]}</p>
            `;
            gridContainer.appendChild(item);
        });

        movieGrid.appendChild(gridContainer);
        return; 
    }

    // 🌟 일반 장르 탭을 눌렀을 때 (기존 3D 로직 복구)
    movieGrid.style.display = "flex";
    movieGrid.style.paddingBottom = "0";
    // 🚨 BUG FIX 3: 높이를 3D 무대 원래 높이(CSS)로 복구 (안 하면 높이 꼬여서 포스터 잘림!)
    movieGrid.style.height = ""; 

    const bgFiles = {
        "SF_TIME": "sf_time",
        "THRILLER": "mystery_thriller",
        "ROMANCE": "music_romance",
        "DRAMA": "drama_human"
    };

    movieGrid.style.backgroundImage = `url('./images/${bgFiles[selectedGenre]}.jpg')`;

    const filteredMovies = movies.filter(m => m.genre === selectedGenre);
    const totalMovies = filteredMovies.length;
    
    if (totalMovies === 0) return;

    // 🌟 L3. [반응형] 자바스크립트에서도 화면 크기를 감지해서 3D 원통 반경(tz) 조절
    const screenWidth = window.innerWidth;
    let cardWidth = 380; 
    if (screenWidth <= 480) cardWidth = 200;
    else if (screenWidth <= 768) cardWidth = 260;

    const rotateAngle = 360 / totalMovies;
    const tz = Math.round((cardWidth / 2) / Math.tan(Math.PI / totalMovies)) + (screenWidth <= 768 ? 50 : 150);

    const track = document.createElement("div");
    track.className = "carousel-track";
    movieGrid.appendChild(track);

    function resetCardUI(idx) {
        if (idx === null) return;
        const img = document.getElementById(`img-${idx}`);
        const notice = document.getElementById(`notice-${idx}`);
        if (img) img.src = filteredMovies[idx].poster;
        if (notice) {
            notice.innerText = "💡 클릭하면 재생되고 자동 회전이 멈춥니다.";
            notice.style.color = "#e50914";
        }
    }

    function updateActiveCard() {
        const activeIndex = Math.round((-currAngle / rotateAngle) % totalMovies + totalMovies) % totalMovies;
        document.querySelectorAll('.movie-card').forEach((c, idx) => {
            c.classList.toggle('active-center', idx === activeIndex);
            
            if (idx !== activeIndex && currentPlayingIndex === idx) {
                resetCardUI(idx);
                currentPlayingIndex = null;
            }
        });
    }

    function startAutoPlay() {
        clearInterval(autoPlayTimer);
        autoPlayTimer = setInterval(() => {
            currAngle -= rotateAngle;
            track.style.transform = `rotateY(${currAngle}deg)`;
            updateActiveCard();
        }, 3000);
    }

    function stopAutoPlay() {
        clearInterval(autoPlayTimer);
        clearTimeout(initialStartTimer);
    }

    filteredMovies.forEach((movie, index) => {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.style.transform = `rotateY(${index * rotateAngle}deg) translateZ(${tz}px)`;
        
        // 🚨 [접근성 A3] 카드가 탭(Tab) 키로 선택될 수 있도록 속성 부여
        card.tabIndex = 0; 
        
        // 이미지에 있던 tabindex는 지웠어! (카드가 통째로 선택되는 게 맞음)
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title} 영화 포스터" id="img-${index}">
            <div class="movie-info">
                <h2 class="movie-title">${movie.title}</h2>
                <p class="movie-desc">${movie.comment}</p>
                <div class="click-notice" id="notice-${index}">💡 클릭하면 재생되고 자동 회전이 멈춥니다.</div>
            </div>
        `;
        track.appendChild(card);

        if (index === 0) card.classList.add('active-center');

        // 기존 클릭 이벤트
        card.addEventListener("click", () => {
            const targetIndex = Math.round((-currAngle / rotateAngle) % totalMovies + totalMovies) % totalMovies;
            if (index !== targetIndex) return;

            const imgElement = document.getElementById(`img-${index}`);
            const noticeElement = document.getElementById(`notice-${index}`);

            if (currentPlayingIndex === index) {
                resetCardUI(index);
                currentPlayingIndex = null;
                startAutoPlay(); 
            } else {
                stopAutoPlay(); 
                currentPlayingIndex = index; 

                imgElement.src = movie.quoteImg;
                noticeElement.innerText = "🎵 감상 중! (다시 클릭하면 회전 재개)";
                noticeElement.style.color = "#aaa";
                
                let targetUrl = `https://www.youtube.com/watch?v=${movie.youtube}`;
                if (movie.startTime) {
                    targetUrl += `&t=${movie.startTime}s`;
                }
                window.open(targetUrl, "OSTWindow", "width=400,height=300");
            }
        });

        // 🚨 [접근성 A3] 키보드 Enter 키를 누르면 클릭한 것과 똑같이 동작하게 만듦!
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                card.click(); // 위에 있는 클릭 이벤트를 강제로 실행시킴
            }
        });
    });

    movieGrid.onwheel = (e) => {
        // 🌟 폰 터치 스와이프 로직 추가
    let touchStartX = 0;
    
    movieGrid.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    movieGrid.addEventListener("touchend", (e) => {
        let touchEndX = e.changedTouches[0].screenX;
        let diff = touchStartX - touchEndX;

        // 🚨 터치 거리가 어느 정도 될 때만 회전 (너무 예민하면 오작동 방지)
        if (Math.abs(diff) > 50) { 
            stopAutoPlay();
            
            // 휠 방향과 맞춰서 오른쪽으로 밀면 다음 영화, 왼쪽으로 밀면 이전 영화
            currAngle += (diff > 0) ? -rotateAngle : rotateAngle;
            track.style.transform = `rotateY(${currAngle}deg)`;
            updateActiveCard();

            // 다시 자동 재생 타이머 초기화
            clearTimeout(window.wheelTimeout);
            window.wheelTimeout = setTimeout(() => {
                if (currentPlayingIndex === null) startAutoPlay();
            }, 2000);
        }
    }, { passive: true });
        e.preventDefault();
        
        if (isWheeling) return; 
        isWheeling = true;
        setTimeout(() => { isWheeling = false; }, 600); 

        stopAutoPlay(); 
        
        currAngle += (e.deltaY > 0) ? -rotateAngle : rotateAngle;
        track.style.transform = `rotateY(${currAngle}deg)`;
        updateActiveCard();

        clearTimeout(window.wheelTimeout);
        window.wheelTimeout = setTimeout(() => {
            if (currentPlayingIndex === null) startAutoPlay();
        }, 2000); 
    };

    initialStartTimer = setTimeout(() => {
        startAutoPlay();
    }, 2000);
}

// 🌟 3. 상단 4대 장르 탭 버튼 생성
function createGenreButtons() {
    const header = document.querySelector("header");
    let btnContainer = document.querySelector(".genre-container");
    if (!btnContainer) {
        btnContainer = document.createElement("div");
        btnContainer.className = "genre-container";
        header.appendChild(btnContainer);
    }
    btnContainer.innerHTML = "";
    
    // 🌟 L2. "전체 영화" 탭 버튼 추가
    const genreMenu = [
        { name: "SF / TIME", tag: "SF_TIME" },
        { name: "MYSTERY / THRILLER", tag: "THRILLER" },
        { name: "MUSIC / ROMANCE", tag: "ROMANCE" },
        { name: "DRAMA / HUMAN", tag: "DRAMA" },
        { name: "전체 영화", tag: "ALL" } 
    ];
    
    genreMenu.forEach((genre, idx) => {
        const btn = document.createElement("button");
        btn.className = "genre-btn";
        btn.innerText = genre.name;
        if (idx === 0) btn.classList.add("active");
        btn.addEventListener("click", () => {
            document.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            initGenreDisplay(genre.tag);
        });
        btnContainer.appendChild(btn);
    });
}

// 🌟 4. [fetch API] 외부 데이터 가져오기 로직 (D1 ~ D5 충족)
async function fetchMovieData() {
    try {
        const response = await fetch('./movies.json');
        if (!response.ok) throw new Error('네트워크 상태가 불안정합니다.');
        movies = await response.json(); 

        createGenreButtons();
        initGenreDisplay("SF_TIME");
    } catch (error) {
        console.error("데이터 로드 실패:", error);
        movieGrid.innerHTML = `
            <div style="color: #fff; text-align: center; padding: 50px; background: rgba(0,0,0,0.7); border-radius: 10px;">
                <h2 style="color: #e50914;">⚠️ 영화 데이터를 불러올 수 없습니다.</h2>
                <p>로컬 서버 환경(Live Server)에서 실행 중인지 확인해주세요.<br>에러 메시지: ${error.message}</p>
            </div>
        `;
    }
}

window.addEventListener("resize", () => {
    const activeBtn = Array.from(document.querySelectorAll(".genre-btn")).find(b => b.classList.contains("active"));
    if (activeBtn) {
        const genreName = activeBtn.innerText;
        let tag = "SF_TIME";
        if (genreName.includes("MYSTERY")) tag = "THRILLER";
        else if (genreName.includes("MUSIC")) tag = "ROMANCE";
        else if (genreName.includes("DRAMA")) tag = "DRAMA";
        else if (genreName === "전체 영화") tag = "ALL";
        
        initGenreDisplay(tag);
    }
});

window.addEventListener("DOMContentLoaded", () => {
    fetchMovieData();
    // 🌟 U7. [Form] 폼 제출 유효성 검사 (말풍선 경고창 커스텀)
document.addEventListener("DOMContentLoaded", () => {
    const reviewForm = document.getElementById("review-form");
    const reviewInput = document.getElementById("user-review");

    if (reviewInput && reviewForm) {
        
        // 🚨 폼 제출을 시도할 때, 입력값이 비어있으면 말풍선 내용 변경
        reviewInput.addEventListener("invalid", function (e) {
            if (this.value.trim() === "") {
                this.setCustomValidity("감상비는 감상평 한 줄 이상😆");
            }
        });

        // 🚨 사용자가 글씨를 한 글자라도 쓰기 시작하면, 에러(말풍선) 강제 해제
        reviewInput.addEventListener("input", function () {
            this.setCustomValidity("");
        });

        // 정상적으로 글을 쓰고 제출 버튼을 눌렀을 때
        reviewForm.addEventListener("submit", (e) => {
            e.preventDefault(); 
            
            // 제출 완료 시 가벼운 인사말 띄우고 폼 비워주기
            alert("소중한 감상비(감상평) 감사합니다! 🎬");
            reviewInput.value = ""; 
        });
    }
});
});