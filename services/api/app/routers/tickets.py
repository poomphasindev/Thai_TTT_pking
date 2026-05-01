import hashlib

from fastapi import APIRouter, HTTPException, Request, Response

from app.auth_repository import SESSION_COOKIE, auth_repo
from app.models import TicketCreate, TicketOut, TicketTapCreate, TicketTapOut, TicketTapResponse
from app.ticket_repository import tickets_repo

router = APIRouter()


@router.post("/tickets", response_model=TicketOut, status_code=201)
def create_ticket(payload: TicketCreate, request: Request) -> TicketOut:
    user = auth_repo.get_user_by_token(request.cookies.get(SESSION_COOKIE))
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in before issuing a Joint Ticket")
    return tickets_repo.create(payload, user_id=user.id)


@router.get("/tickets", response_model=list[TicketOut])
def list_tickets() -> list[TicketOut]:
    return tickets_repo.list()


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: str) -> TicketOut:
    ticket = tickets_repo.get(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/tickets/{ticket_id}/taps", response_model=list[TicketTapOut])
def list_ticket_taps(ticket_id: str) -> list[TicketTapOut]:
    if tickets_repo.get(ticket_id) is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return tickets_repo.taps(ticket_id)


@router.post("/tickets/{ticket_id}/tap", response_model=TicketTapResponse)
def tap_ticket(ticket_id: str, payload: TicketTapCreate) -> TicketTapResponse:
    result = tickets_repo.tap(ticket_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return result


@router.post("/tickets/{ticket_id}/revoke", response_model=TicketOut)
def revoke_ticket(ticket_id: str) -> TicketOut:
    ticket = tickets_repo.revoke(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/tickets/{ticket_id}/qr.svg")
def ticket_qr(ticket_id: str) -> Response:
    ticket = tickets_repo.get(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    svg = _real_qr_svg(ticket.qr_payload) or _demo_qr_svg(ticket.qr_payload)
    return Response(content=svg, media_type="image/svg+xml")


def _real_qr_svg(payload: str) -> str | None:
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        return None

    image = qrcode.make(
        payload,
        image_factory=qrcode.image.svg.SvgPathImage,
        box_size=12,
        border=3,
    )
    raw = image.to_string(encoding="unicode")
    return raw.replace("<svg ", '<svg role="img" aria-label="Joint ticket QR" ')


def _demo_qr_svg(payload: str) -> str:
    digest = hashlib.sha256(payload.encode("utf-8")).digest()
    size = 29
    cell = 8
    pad = 3
    total = (size + pad * 2) * cell
    occupied: set[tuple[int, int]] = set()

    def finder(x: int, y: int) -> list[str]:
        shapes = []
        for row in range(7):
            for col in range(7):
                outer = row in {0, 6} or col in {0, 6}
                inner = 2 <= row <= 4 and 2 <= col <= 4
                if outer or inner:
                    occupied.add((x + col, y + row))
                    shapes.append(rect(x + col, y + row))
        return shapes

    def bit_at(index: int) -> bool:
        byte = digest[(index // 8) % len(digest)]
        return bool(byte & (1 << (index % 8)))

    def rect(x: int, y: int) -> str:
        return f'<rect x="{(x + pad) * cell}" y="{(y + pad) * cell}" width="{cell}" height="{cell}" rx="1"/>'

    shapes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{total}" height="{total}" viewBox="0 0 {total} {total}">',
        '<rect width="100%" height="100%" rx="18" fill="#fffdfa"/>',
        '<g fill="#083f36">',
    ]
    shapes.extend(finder(0, 0))
    shapes.extend(finder(size - 7, 0))
    shapes.extend(finder(0, size - 7))

    cursor = 0
    for y in range(size):
        for x in range(size):
            if (x, y) in occupied:
                continue
            should_fill = bit_at(cursor) if (x + y) % 2 == 0 else bit_at(cursor + 11)
            if should_fill:
                shapes.append(rect(x, y))
            cursor += 1

    shapes.append("</g></svg>")
    return "".join(shapes)
