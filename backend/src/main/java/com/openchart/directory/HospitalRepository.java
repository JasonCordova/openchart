package com.openchart.directory;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class HospitalRepository {
    private static final String SELECT = "SELECT id, name, address, city, state, zip, website_url, latitude, longitude FROM hospitals";
    private static final RowMapper<Hospital> MAPPER = (rs, row) -> new Hospital(
        rs.getLong("id"), rs.getString("name"), rs.getString("address"), rs.getString("city"),
        rs.getString("state"), rs.getString("zip"), rs.getString("website_url"),
        coordinate(rs.getString("latitude"), 90), coordinate(rs.getString("longitude"), 180));

    private final JdbcTemplate jdbc;

    public HospitalRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Hospital> findAll() {
        return jdbc.query(SELECT + " ORDER BY state, city, name, id", MAPPER);
    }

    public Optional<Hospital> findById(long id) {
        return jdbc.query(SELECT + " WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    private static Double coordinate(String value, double limit) {
        if (value == null || value.isBlank()) return null;
        try {
            double number = Double.parseDouble(value.trim());
            return Double.isFinite(number) && Math.abs(number) <= limit ? number : null;
        } catch (NumberFormatException ignored) { return null; }
    }
}
