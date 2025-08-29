import requests
from bs4 import BeautifulSoup


def safe_get_text(soup, selector, index=0, attr="text", default="", join_strings=False):
    """
    Utility function to safely extract text/attribute from HTML.
    """
    try:
        if isinstance(selector, tuple):  # selector like ('div', 'classname')
            elements = soup.find_all(selector[0], class_=selector[1])
        else:
            elements = soup.select(selector)

        if len(elements) > index:
            if attr == "text":
                if join_strings:
                    return " ".join(elements[index].stripped_strings)
                return elements[index].get_text(strip=True)
            else:
                return elements[index].get(attr, default)
        return default
    except Exception:
        return default


def get_live_score(url, team_1=None, team_2=None):
    """
    Fetch live cricket score details from given URL.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except Exception:
        return {"error": "Unable to fetch data"}

    soup = BeautifulSoup(response.text, 'html.parser')

    match_name = safe_get_text(soup, ('h1', 'name-wrapper'))

    # Score + Over
    score, over = "", ""
    a = soup.find('div', class_='runs f-runs')
    if a:
        spans = a.find_all("span")
        if len(spans) >= 2:
            score = spans[0].get_text(strip=True)
            over = spans[1].get_text(strip=True)

    # Team details
    team1 = team_1 or safe_get_text(soup, ('div', 'teamNameScreenText'), 0)
    team2 = team_2 or safe_get_text(soup, ('div', 'teamNameScreenText'), 1)

    crr = safe_get_text(soup, ('span', 'title'))
    main_message = safe_get_text(soup, ('div', 'result-box'))

    # Extra info
    extra_message = safe_get_text(soup, ('div', 'final-result m-none'), 0, join_strings=True)
    extra_message1 = safe_get_text(soup, ('div', 'final-result comment m-none'), 0, join_strings=True)

    # Players
    batsman_1 = safe_get_text(soup, ('div', 'batsmen-name'), 0)
    batsman_1_score = safe_get_text(soup, ('div', 'batsmen-score'), 0)
    batsman_2 = safe_get_text(soup, ('div', 'batsmen-name'), 1)
    batsman_2_score = safe_get_text(soup, ('div', 'batsmen-score'), 1)
    bowler = safe_get_text(soup, ('div', 'bowler-name'), 0)
    bowler_score = safe_get_text(soup, ('div', 'bowler-figures'), 0)

    # Percentages
    team1_perc, team2_perc = "0", "0"
    try:
        team1_perc = safe_get_text(soup, ('div', 'percentageScreenText'), 0, default="0").replace("%", "")
        team2_perc = safe_get_text(soup, ('div', 'percentageScreenText'), 1, default="0").replace("%", "")
    except Exception:
        pass

    fav_team, odd_1, odd_2 = "", "00", "00"
    try:
        t1 = int(team1_perc)
        t2 = int(team2_perc)
        if t1 < t2:
            fav_team = team2
            odd_1, odd_2 = str(t1 * 2), str(t1 * 2 + 1)
        else:
            fav_team = team1
            odd_1, odd_2 = str(t2 * 2), str(t2 * 2 + 1)

        if int(odd_1) < 10:
            odd_1 = "0" + odd_1
        if int(odd_2) < 10:
            odd_2 = "0" + odd_2
    except Exception:
        pass

    d = {
        'match_name': match_name,
        'score': score,
        'over': over,
        'team1': team1,
        'team2': team2,
        'CRR': crr,
        'main_message': main_message,
        'batsman_1': batsman_1,
        'batsman_1_score': batsman_1_score,
        'batsman_2': batsman_2,
        'batsman_2_score': batsman_2_score,
        'bowler': bowler,
        'bowler_score': bowler_score,
        'fav_team': fav_team,
        'odd_1': odd_1,
        'odd_2': odd_2,
        'extra_message': extra_message,
        'extra_message1': extra_message1
    }

    # Ensure some data is returned, not empty
    return d if any(v for v in d.values() if v) else {"error": "Score not available"}


if __name__ == "__main__":
    # 🔹 Quick test runner
    TEST_URL = "https://www.espncricinfo.com/live-cricket-score"  # replace with real match URL
    print(get_live_score(TEST_URL)) 
